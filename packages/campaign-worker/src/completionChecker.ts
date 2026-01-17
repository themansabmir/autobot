import { CampaignStatus, RecipientStatus } from "@prisma/client";
import prisma from "@typebot.io/prisma";
import { config } from "./config";

const checkCampaignCompletion = async (): Promise<void> => {
  const runningCampaigns = await prisma.campaign.findMany({
    where: {
      status: CampaignStatus.RUNNING,
    },
    select: {
      id: true,
      title: true,
      totalRecipients: true,
    },
  });

  for (const campaign of runningCampaigns) {
    const pendingCount = await prisma.campaignRecipient.count({
      where: {
        campaignId: campaign.id,
        status: {
          in: [RecipientStatus.PENDING, RecipientStatus.QUEUED],
        },
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
    } else {
      console.log(
        `⏳ Campaign "${campaign.title}": ${pendingCount} recipients still pending`,
      );
    }
  }
};

const runCompletionChecker = async (): Promise<void> => {
  console.log("🔍 Completion Checker starting...");

  const poll = async () => {
    try {
      await checkCampaignCompletion();
    } catch (error) {
      console.error("❌ Completion checker error:", error);
    }
  };

  await poll();

  setInterval(poll, config.completionChecker.pollIntervalMs);

  console.log(
    `🔍 Completion Checker running, polling every ${config.completionChecker.pollIntervalMs}ms`,
  );
};

process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down completion checker...");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Shutting down completion checker...");
  process.exit(0);
});

runCompletionChecker().catch((error) => {
  console.error("❌ Failed to start completion checker:", error);
  process.exit(1);
});
