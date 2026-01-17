import { CampaignStatus } from "@prisma/client";
import prisma from "@typebot.io/prisma";
import { config } from "./config";
import { closeRabbitMQ, connectRabbitMQ, publishCampaignJob } from "./rabbitmq";

const processScheduledCampaigns = async (): Promise<void> => {
  const now = new Date();

  const campaigns = await prisma.$transaction(async (tx) => {
    const scheduledCampaigns = await tx.campaign.findMany({
      where: {
        OR: [
          {
            status: CampaignStatus.SCHEDULED,
            executeAt: { lte: now },
          },
          {
            status: CampaignStatus.PENDING,
            executionMode: "NOW",
          },
        ],
      },
      select: {
        id: true,
        workspaceId: true,
        title: true,
      },
    });

    if (scheduledCampaigns.length === 0) return [];

    await tx.campaign.updateMany({
      where: {
        id: { in: scheduledCampaigns.map((c) => c.id) },
      },
      data: {
        status: CampaignStatus.RUNNING,
        startedAt: now,
      },
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

const runScheduler = async (): Promise<void> => {
  console.log("🕐 Campaign Scheduler starting...");
  await connectRabbitMQ();

  const poll = async () => {
    try {
      await processScheduledCampaigns();
    } catch (error) {
      console.error("❌ Scheduler error:", error);
    }
  };

  await poll();

  setInterval(poll, config.scheduler.pollIntervalMs);

  console.log(
    `🕐 Scheduler running, polling every ${config.scheduler.pollIntervalMs}ms`,
  );
};

process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down scheduler...");
  await closeRabbitMQ();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Shutting down scheduler...");
  await closeRabbitMQ();
  process.exit(0);
});

runScheduler().catch((error) => {
  console.error("❌ Failed to start scheduler:", error);
  process.exit(1);
});
