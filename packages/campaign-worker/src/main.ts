import { CampaignStatus, RecipientStatus } from "@prisma/client";
import { startSession } from "@typebot.io/bot-engine/startSession";
import type { SessionState } from "@typebot.io/chat-session/schemas";
import { decrypt } from "@typebot.io/credentials/decrypt";
import { getCredentials } from "@typebot.io/credentials/getCredentials";
import type { WhatsAppCredentials } from "@typebot.io/credentials/schemas";
import { downloadCampaignFile } from "@typebot.io/lib/campaign/downloadCampaignFile";
import prisma from "@typebot.io/prisma";
import {
  deleteSessionStore,
  getSessionStore,
} from "@typebot.io/runtime-session-store";
import { sendChatReplyToWhatsApp } from "@typebot.io/whatsapp/sendChatReplyToWhatsApp";
import type { ConsumeMessage } from "amqplib";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { config } from "./config";
import {
  type CampaignJob,
  closeRabbitMQ,
  connectRabbitMQ,
  publishCampaignJob,
  publishRecipientJobsBatch,
  type RecipientJob,
} from "./rabbitmq";

console.log("🚀 Campaign Worker Service starting...");

// ==================== FILE PARSING ====================
interface RecipientRow {
  phone?: string;
  phoneNumber?: string;
  phone_number?: string;
  mobile?: string;
  [key: string]: unknown;
}

const normalizePhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, "");
};

const extractPhoneNumber = (row: RecipientRow): string | null => {
  const phoneValue =
    row.phone || row.phoneNumber || row.phone_number || row.mobile;
  if (!phoneValue) return null;

  // Convert to string if it's a number (common in Excel files)
  const phone =
    typeof phoneValue === "number" ? String(phoneValue) : phoneValue;
  if (typeof phone !== "string") return null;

  const normalized = normalizePhoneNumber(phone);
  if (normalized.length < 10) return null;
  return normalized;
};

const parseFile = async (fileUrl: string): Promise<RecipientRow[]> => {
  console.log(`📂 Fetching file: ${fileUrl}`);
  const buffer = await downloadCampaignFile(fileUrl);
  const fileName = fileUrl.toLowerCase();

  if (fileName.endsWith(".csv")) {
    const text = new TextDecoder().decode(new Uint8Array(buffer));
    const result = Papa.parse<RecipientRow>(text, {
      header: true,
      skipEmptyLines: true,
    });
    return result.data;
  }

  if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json<RecipientRow>(sheet);
  }

  throw new Error(`Unsupported file format: ${fileName}`);
};

// ==================== SCHEDULER ====================
const processScheduledCampaigns = async (): Promise<void> => {
  const now = new Date();

  const campaigns = await prisma.$transaction(async (tx) => {
    const scheduledCampaigns = await tx.campaign.findMany({
      where: {
        OR: [
          { status: CampaignStatus.SCHEDULED, executeAt: { lte: now } },
          { status: CampaignStatus.PENDING, executionMode: "NOW" },
        ],
      },
      select: { id: true, workspaceId: true, title: true },
    });

    if (scheduledCampaigns.length === 0) return [];

    await tx.campaign.updateMany({
      where: { id: { in: scheduledCampaigns.map((c) => c.id) } },
      data: { status: CampaignStatus.RUNNING, startedAt: now },
    });

    return scheduledCampaigns;
  });

  for (const campaign of campaigns) {
    console.log(`🚀 Enqueuing campaign: ${campaign.title} (${campaign.id})`);
    await publishCampaignJob({
      campaignId: campaign.id,
      workspaceId: campaign.workspaceId,
    });
  }

  if (campaigns.length > 0) {
    console.log(`✅ Enqueued ${campaigns.length} campaigns`);
  }
};

// ==================== CAMPAIGN WORKER ====================
const processCampaignJob = async (job: CampaignJob): Promise<void> => {
  const { campaignId } = job;
  console.log(`📋 Processing campaign: ${campaignId}`);

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, fileUrl: true, status: true },
  });

  if (!campaign) {
    console.error(`❌ Campaign not found: ${campaignId}`);
    return;
  }

  if (campaign.status !== CampaignStatus.RUNNING) {
    console.log(`⏭️ Campaign ${campaignId} is not in RUNNING status, skipping`);
    return;
  }

  try {
    const rows = await parseFile(campaign.fileUrl);
    console.log(`📊 Parsed ${rows.length} rows from file`);

    const recipients: {
      phoneNumber: string;
      variables: Record<string, unknown>;
    }[] = [];

    for (const row of rows) {
      const phoneNumber = extractPhoneNumber(row);
      if (!phoneNumber) {
        console.warn("⚠️ Skipping row with invalid phone");
        continue;
      }

      const {
        phone: _p,
        phoneNumber: _pn,
        phone_number: _pnu,
        mobile: _m,
        ...variables
      } = row;
      recipients.push({ phoneNumber, variables });
    }

    console.log(`✅ Valid recipients: ${recipients.length}`);

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { totalRecipients: recipients.length },
    });

    const batchSize = config.worker.batchSize;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      await prisma.campaignRecipient.createMany({
        data: batch.map((r) => ({
          campaignId,
          phoneNumber: r.phoneNumber,
          variables: r.variables as object,
          status: RecipientStatus.QUEUED,
        })),
      });

      const createdRecipients = await prisma.campaignRecipient.findMany({
        where: {
          campaignId,
          phoneNumber: { in: batch.map((r) => r.phoneNumber) },
        },
        select: {
          id: true,
          phoneNumber: true,
          variables: true,
        },
      });

      const recipientJobs: RecipientJob[] = createdRecipients.map((r) => ({
        recipientId: r.id,
        campaignId,
        phoneNumber: r.phoneNumber,
        variables: r.variables as Record<string, unknown> | undefined,
      }));

      await publishRecipientJobsBatch(recipientJobs);

      console.log(
        `📤 Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} recipients queued`,
      );
    }

    console.log(`✅ Campaign ${campaignId} fully queued`);
  } catch (error) {
    console.error(`❌ Failed to process campaign ${campaignId}:`, error);

    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: CampaignStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : String(error),
        completedAt: new Date(),
      },
    });
  }
};

// ==================== WHATSAPP WORKER ====================
const MAX_RETRIES = config.worker.maxRetries;

// Rate limiting tracking
let messagesSentLastMinute = 0;
let messagesSentLastHour = 0;
let lastMinuteReset = Date.now();
let lastHourReset = Date.now();

const checkRateLimit = async (): Promise<void> => {
  const now = Date.now();
  const { maxMessagesPerMinute, maxMessagesPerHour, delayBetweenMessages } =
    config.rateLimit;

  if (now - lastMinuteReset >= 60000) {
    messagesSentLastMinute = 0;
    lastMinuteReset = now;
  }
  if (now - lastHourReset >= 3600000) {
    messagesSentLastHour = 0;
    lastHourReset = now;
  }

  if (
    maxMessagesPerMinute > 0 &&
    messagesSentLastMinute >= maxMessagesPerMinute
  ) {
    const waitTime = 60000 - (now - lastMinuteReset);
    console.log(
      `⏱️ Rate limit: ${maxMessagesPerMinute}/min reached. Waiting ${Math.ceil(waitTime / 1000)}s...`,
    );
    await new Promise((resolve) => setTimeout(resolve, waitTime));
    messagesSentLastMinute = 0;
    lastMinuteReset = Date.now();
  }

  if (maxMessagesPerHour > 0 && messagesSentLastHour >= maxMessagesPerHour) {
    const waitTime = 3600000 - (now - lastHourReset);
    console.log(
      `⏱️ Rate limit: ${maxMessagesPerHour}/hour reached. Waiting ${Math.ceil(waitTime / 60000)}min...`,
    );
    await new Promise((resolve) => setTimeout(resolve, waitTime));
    messagesSentLastHour = 0;
    lastHourReset = Date.now();
  }

  if (delayBetweenMessages > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayBetweenMessages));
  }
};

const sendWhatsAppMessage = async (
  campaignId: string,
  recipientId: string,
  phoneNumber: string,
  variables?: Record<string, unknown>,
): Promise<void> => {
  console.log(`📱 Starting WhatsApp campaign message to: ${phoneNumber}`);

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      workspaceId: true,
      typebotId: true,
      typebot: {
        select: {
          id: true,
          publicId: true,
          whatsAppCredentialsId: true,
        },
      },
    },
  });

  if (!campaign) {
    throw new Error(`Campaign not found: ${campaignId}`);
  }

  if (!campaign.typebot.publicId) {
    throw new Error(
      `Typebot ${campaign.typebotId} is not published. Please publish the typebot first.`,
    );
  }

  if (!campaign.typebot.whatsAppCredentialsId) {
    throw new Error(
      `Typebot ${campaign.typebotId} does not have WhatsApp credentials configured.`,
    );
  }

  const credentialsRecord = await getCredentials(
    campaign.typebot.whatsAppCredentialsId,
    campaign.workspaceId,
  );

  if (!credentialsRecord) {
    throw new Error(
      `WhatsApp credentials not found: ${campaign.typebot.whatsAppCredentialsId}`,
    );
  }

  const credentials = (await decrypt(
    credentialsRecord.data,
    credentialsRecord.iv,
  )) as WhatsAppCredentials["data"];

  const sessionId = `campaign-${campaignId}-${recipientId}`;
  const sessionStore = getSessionStore(sessionId);

  console.log(`🔄 Starting typebot session for campaign recipient`, {
    sessionId,
    typebotId: campaign.typebotId,
    publicId: campaign.typebot.publicId,
    phoneNumber,
  });

  const initialSessionState: Pick<SessionState, "whatsApp" | "expiryTimeout"> =
    {
      whatsApp: {
        contact: {
          name: phoneNumber,
          phoneNumber,
        },
      },
      expiryTimeout: 24 * 60 * 60 * 1000,
    };

  const startResponse = await startSession({
    version: 2,
    startParams: {
      type: "live",
      publicId: campaign.typebot.publicId,
      isOnlyRegistering: false,
      isStreamEnabled: false,
      textBubbleContentFormat: "richText",
      prefilledVariables: variables,
    },
    initialSessionState,
    sessionStore,
  });

  console.log(`✅ Typebot session started, sending messages to ${phoneNumber}`);

  // Check if we should actually send WhatsApp messages (for testing)
  const skipWhatsAppSending = process.env.CAMPAIGN_SKIP_WHATSAPP === "true";

  if (skipWhatsAppSending) {
    console.log(`🧪 TEST MODE: Skipping WhatsApp API call for ${phoneNumber}`);
    console.log(`🧪 Would have sent ${startResponse.messages.length} messages`);
  } else {
    await sendChatReplyToWhatsApp({
      to: phoneNumber,
      messages: startResponse.messages,
      input: startResponse.input,
      isFirstChatChunk: true,
      clientSideActions: startResponse.clientSideActions,
      credentials,
      state: startResponse.newSessionState,
    });
  }

  deleteSessionStore(sessionId);

  console.log(
    `✅ Campaign message sent successfully to ${phoneNumber} (${startResponse.messages.length} messages)`,
  );
};

const processRecipientJob = async (job: RecipientJob): Promise<void> => {
  const { recipientId, phoneNumber, variables, campaignId } = job;

  await checkRateLimit();

  const recipient = await prisma.campaignRecipient.findUnique({
    where: { id: recipientId },
    select: { id: true, status: true, retryCount: true },
  });

  if (!recipient) {
    console.error(`❌ Recipient not found: ${recipientId}`);
    return;
  }

  if (recipient.status === RecipientStatus.SENT) {
    console.log(
      `⏭️ Recipient ${recipientId} already sent, skipping (idempotency)`,
    );
    return;
  }

  try {
    await sendWhatsAppMessage(campaignId, recipientId, phoneNumber, variables);

    messagesSentLastMinute++;
    messagesSentLastHour++;

    await prisma.$transaction([
      prisma.campaignRecipient.update({
        where: { id: recipientId },
        data: { status: RecipientStatus.SENT, sentAt: new Date() },
      }),
      prisma.campaign.update({
        where: { id: campaignId },
        data: { sentCount: { increment: 1 } },
      }),
    ]);

    console.log(`✅ Message sent to ${phoneNumber}`);
  } catch (error) {
    const newRetryCount = recipient.retryCount + 1;
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (newRetryCount >= MAX_RETRIES) {
      await prisma.$transaction([
        prisma.campaignRecipient.update({
          where: { id: recipientId },
          data: {
            status: RecipientStatus.FAILED,
            retryCount: newRetryCount,
            errorMessage,
          },
        }),
        prisma.campaign.update({
          where: { id: campaignId },
          data: { failedCount: { increment: 1 } },
        }),
      ]);

      console.error(
        `❌ Message to ${phoneNumber} failed after ${MAX_RETRIES} retries`,
      );
    } else {
      await prisma.campaignRecipient.update({
        where: { id: recipientId },
        data: { retryCount: newRetryCount, errorMessage },
      });

      throw error; // Re-throw to nack and retry
    }
  }
};

// ==================== COMPLETION CHECKER ====================
const checkCampaignCompletion = async (): Promise<void> => {
  const runningCampaigns = await prisma.campaign.findMany({
    where: { status: CampaignStatus.RUNNING },
    select: { id: true, title: true, totalRecipients: true },
  });

  for (const campaign of runningCampaigns) {
    const pendingCount = await prisma.campaignRecipient.count({
      where: {
        campaignId: campaign.id,
        status: { in: [RecipientStatus.PENDING, RecipientStatus.QUEUED] },
      },
    });

    if (pendingCount === 0 && campaign.totalRecipients !== null) {
      const finalStats = await prisma.campaignRecipient.groupBy({
        by: ["status"],
        where: { campaignId: campaign.id },
        _count: { status: true },
      });

      const sentCount =
        finalStats.find((s) => s.status === RecipientStatus.SENT)?._count
          .status ?? 0;
      const failedCount =
        finalStats.find((s) => s.status === RecipientStatus.FAILED)?._count
          .status ?? 0;

      await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          status: CampaignStatus.COMPLETED,
          completedAt: new Date(),
          sentCount,
          failedCount,
        },
      });

      console.log(
        `✅ Campaign "${campaign.title}" completed: ${sentCount} sent, ${failedCount} failed`,
      );
    }
  }
};

// ==================== MAIN ====================
const main = async () => {
  const channel = await connectRabbitMQ();

  // Start scheduler polling
  console.log(
    `🕐 Scheduler polling every ${config.scheduler.pollIntervalMs}ms`,
  );
  setInterval(async () => {
    try {
      await processScheduledCampaigns();
    } catch (error) {
      console.error("❌ Scheduler error:", error);
    }
  }, config.scheduler.pollIntervalMs);

  // Start completion checker polling
  console.log(
    `🔍 Completion checker polling every ${config.completionChecker.pollIntervalMs}ms`,
  );
  setInterval(async () => {
    try {
      await checkCampaignCompletion();
    } catch (error) {
      console.error("❌ Completion checker error:", error);
    }
  }, config.completionChecker.pollIntervalMs);

  // Campaign worker consumer
  await channel.prefetch(config.worker.prefetchCount);

  await channel.consume(
    config.rabbitmq.queues.campaign,
    async (msg: ConsumeMessage | null) => {
      if (!msg) return;

      try {
        const job: CampaignJob = JSON.parse(msg.content.toString());
        await processCampaignJob(job);
        channel.ack(msg);
      } catch (error) {
        console.error("❌ Failed to process campaign job:", error);
        channel.nack(msg, false, false);
      }
    },
    { noAck: false },
  );

  // WhatsApp worker consumer
  await channel.consume(
    config.rabbitmq.queues.whatsapp,
    async (msg: ConsumeMessage | null) => {
      if (!msg) return;

      try {
        const job: RecipientJob = JSON.parse(msg.content.toString());
        await processRecipientJob(job);
        channel.ack(msg);
      } catch (error) {
        console.error("❌ Failed to process recipient job:", error);
        channel.nack(msg, false, true); // Requeue for retry
      }
    },
    { noAck: false },
  );

  console.log("✅ Campaign Worker Service running");
  console.log("   - Scheduler: active");
  console.log("   - Campaign Worker: listening");
  console.log("   - WhatsApp Worker: listening");
  console.log("   - Completion Checker: active");
};

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down Campaign Worker Service...");
  await closeRabbitMQ();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Shutting down Campaign Worker Service...");
  await closeRabbitMQ();
  process.exit(0);
});

main().catch((error) => {
  console.error("❌ Failed to start Campaign Worker Service:", error);
  process.exit(1);
});
