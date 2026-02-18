import { RecipientStatus } from "@prisma/client";
import { decrypt } from "@typebot.io/credentials/decrypt";
import { getCredentials } from "@typebot.io/credentials/getCredentials";
import type { WhatsAppCredentials } from "@typebot.io/credentials/schemas";
import prisma from "@typebot.io/prisma";
import { deleteSessionStore } from "@typebot.io/runtime-session-store";
import { getWhatsAppSessionId } from "@typebot.io/whatsapp/getWhatsAppSessionId";
import { initiateWhatsAppFlow } from "@typebot.io/whatsapp/initiateWhatsAppFlow";

import type { ConsumeMessage } from "amqplib";
import { config } from "./config";
import { closeRabbitMQ, connectRabbitMQ, type RecipientJob } from "./rabbitmq";

// Rate limiting tracking
let messagesSentLastMinute = 0;
let messagesSentLastHour = 0;
let lastMinuteReset = Date.now();
let lastHourReset = Date.now();

const MAX_RETRIES = config.worker.maxRetries;

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

  const sessionId = await getWhatsAppSessionId({
    phoneNumber,
    phoneNumberId:
      "phoneNumberId" in credentials ? credentials.phoneNumberId : "",
  });

  console.log("📱 Starting typebot session for campaign recipient", {
    sessionId,
    typebotId: campaign.typebotId,
    publicId: campaign.typebot.publicId,
    phoneNumber,
  });

  // Check if we should actually send WhatsApp messages (for testing)
  const skipWhatsAppSending = process.env.CAMPAIGN_SKIP_WHATSAPP === "true";

  if (skipWhatsAppSending) {
    console.log(`🧪 TEST MODE: Skipping WhatsApp API call for ${phoneNumber}`);
  } else {
    await initiateWhatsAppFlow({
      to: phoneNumber,
      sessionId,
      typebot: campaign.typebot,
      credentials,
      params: {
        type: "live",
        prefilledVariables: variables,
      },
      initialSessionState: {
        whatsApp: {
          contact: {
            name: phoneNumber,
            phoneNumber,
          },
        },
        expiryTimeout: 24 * 60 * 60 * 1000,
      },
    });

    console.log(
      `✅ [Campaign Analytics] WhatsApp message triggered for recipient ${recipientId} (${phoneNumber})`,
    );
  }

  deleteSessionStore(sessionId);

  console.log(`✅ Campaign message process completed for ${phoneNumber}`);
};

const checkRateLimit = async (): Promise<void> => {
  const now = Date.now();
  const { maxMessagesPerMinute, maxMessagesPerHour, delayBetweenMessages } =
    config.rateLimit;

  // Reset counters if time windows have passed
  if (now - lastMinuteReset >= 60000) {
    messagesSentLastMinute = 0;
    lastMinuteReset = now;
  }
  if (now - lastHourReset >= 3600000) {
    messagesSentLastHour = 0;
    lastHourReset = now;
  }

  // Check per-minute limit
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

  // Check per-hour limit
  if (maxMessagesPerHour > 0 && messagesSentLastHour >= maxMessagesPerHour) {
    const waitTime = 3600000 - (now - lastHourReset);
    console.log(
      `⏱️ Rate limit: ${maxMessagesPerHour}/hour reached. Waiting ${Math.ceil(waitTime / 60000)}min...`,
    );
    await new Promise((resolve) => setTimeout(resolve, waitTime));
    messagesSentLastHour = 0;
    lastHourReset = Date.now();
  }

  // Apply delay between messages
  if (delayBetweenMessages > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayBetweenMessages));
  }
};

const processRecipientJob = async (job: RecipientJob): Promise<void> => {
  const { recipientId, phoneNumber, variables, campaignId } = job;

  // Apply rate limiting before processing
  await checkRateLimit();

  const recipient = await prisma.campaignRecipient.findUnique({
    where: { id: recipientId },
    select: {
      id: true,
      status: true,
      retryCount: true,
    },
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

    // Increment rate limit counters
    messagesSentLastMinute++;
    messagesSentLastHour++;

    await prisma.$transaction([
      prisma.campaignRecipient.update({
        where: { id: recipientId },
        data: {
          status: RecipientStatus.SENT,
          sentAt: new Date(),
        },
      }),
      prisma.campaign.update({
        where: { id: campaignId },
        data: {
          sentCount: { increment: 1 },
        },
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
          data: {
            failedCount: { increment: 1 },
          },
        }),
      ]);

      console.error(
        `❌ Message to ${phoneNumber} failed after ${MAX_RETRIES} retries`,
      );
    } else {
      await prisma.campaignRecipient.update({
        where: { id: recipientId },
        data: {
          retryCount: newRetryCount,
          errorMessage,
        },
      });

      throw error; // Re-throw to nack and retry
    }
  }
};

const runWhatsAppWorker = async (): Promise<void> => {
  console.log("📱 WhatsApp Worker starting...");
  const channel = await connectRabbitMQ();

  await channel.prefetch(config.worker.prefetchCount);

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
        channel.nack(msg, false, true);
      }
    },
    { noAck: false },
  );

  console.log("📱 WhatsApp Worker running, waiting for jobs...");
};

process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down WhatsApp worker...");
  await closeRabbitMQ();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Shutting down WhatsApp worker...");
  await closeRabbitMQ();
  process.exit(0);
});

runWhatsAppWorker().catch((error) => {
  console.error("❌ Failed to start WhatsApp worker:", error);
  process.exit(1);
});
