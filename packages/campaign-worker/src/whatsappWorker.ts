import { RecipientStatus } from "@prisma/client";
import prisma from "@typebot.io/prisma";
import type { ConsumeMessage } from "amqplib";
import { config } from "./config";
import { closeRabbitMQ, connectRabbitMQ, type RecipientJob } from "./rabbitmq";

const MAX_RETRIES = config.worker.maxRetries;

const sendWhatsAppMessage = async (
  phoneNumber: string,
  _variables?: Record<string, unknown>,
): Promise<void> => {
  // TODO: Implement actual WhatsApp sending logic using @typebot.io/whatsapp
  console.log(`📱 Sending WhatsApp message to: ${phoneNumber}`);
  await new Promise((resolve) => setTimeout(resolve, 100));
};

const processRecipientJob = async (job: RecipientJob): Promise<void> => {
  const { recipientId, phoneNumber, variables, campaignId } = job;

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
    await sendWhatsAppMessage(phoneNumber, variables);

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
