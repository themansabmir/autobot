import { CampaignStatus, RecipientStatus } from "@prisma/client";
import { downloadCampaignFile } from "@typebot.io/lib/campaign/downloadCampaignFile";
import prisma from "@typebot.io/prisma";
import type { ConsumeMessage } from "amqplib";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { config } from "./config";
import {
  type CampaignJob,
  closeRabbitMQ,
  connectRabbitMQ,
  publishRecipientJobsBatch,
  type RecipientJob,
} from "./rabbitmq";

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
  const phoneValue = row.phone || row.phoneNumber || row.phone_number || row.mobile;
  
  if (!phoneValue) {
    console.log(`⚠️ No phone found. Available columns:`, Object.keys(row));
    return null;
  }
  
  // Convert to string if it's a number (common in Excel files)
  const phone = typeof phoneValue === "number" ? String(phoneValue) : phoneValue;
  
  if (typeof phone !== "string") {
    console.log(`⚠️ Phone is invalid type. Type: ${typeof phoneValue}, Value:`, phoneValue);
    return null;
  }
  
  const normalized = normalizePhoneNumber(phone);
  if (normalized.length < 10) {
    console.log(`⚠️ Phone too short after normalization. Original: "${phone}", Normalized: "${normalized}" (${normalized.length} digits)`);
    return null;
  }
  
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

const processCampaignJob = async (job: CampaignJob): Promise<void> => {
  const { campaignId } = job;
  console.log(`📋 Processing campaign: ${campaignId}`);

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      fileUrl: true,
      status: true,
    },
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

      const createdRecipients =
        await prisma.campaignRecipient.createManyAndReturn({
          data: batch.map((r) => ({
            campaignId,
            phoneNumber: r.phoneNumber,
            variables: r.variables as object,
            status: RecipientStatus.QUEUED,
          })),
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

const runCampaignWorker = async (): Promise<void> => {
  console.log("👷 Campaign Worker starting...");
  const channel = await connectRabbitMQ();

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

  console.log("👷 Campaign Worker running, waiting for jobs...");
};

process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down campaign worker...");
  await closeRabbitMQ();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Shutting down campaign worker...");
  await closeRabbitMQ();
  process.exit(0);
});

runCampaignWorker().catch((error) => {
  console.error("❌ Failed to start campaign worker:", error);
  process.exit(1);
});
