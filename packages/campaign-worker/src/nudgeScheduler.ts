import { RecipientStatus } from "@prisma/client";
import prisma from "@typebot.io/prisma";
import { config } from "./config";
import { publishNudgeJob } from "./rabbitmq";

export const processScheduledNudges = async (): Promise<void> => {
  const now = new Date();
  console.log(`🕐 [NudgeScheduler] Checking for inactive recipients at ${now.toISOString()}`);

  try {
    // 1. Find candidates that have started the flow but haven't finished,
    // and where we haven't opted them out or exceeded max nudges.
    const candidates = await prisma.campaignRecipient.findMany({
      where: {
        status: { in: [RecipientStatus.SENT, RecipientStatus.DELIVERED, RecipientStatus.OPENED, RecipientStatus.STARTED] },
        campaign: { status: "RUNNING" },
      },
      include: {
        campaign: true,
      },
    });

    if (candidates.length === 0) {
      return;
    }

    let nudgesScheduled = 0;

    for (const recipient of candidates) {
      const campaign = recipient.campaign as any;
      
      if (!campaign) continue;

      // Filter out OPTED_OUT
      if ((recipient as any).nudgeStatus === "OPTED_OUT") continue;

      const nudgeCount = await (prisma as any).nudgeAttempt.count({
        where: { campaignRecipientId: recipient.id }
      });

      // Check if we've reached the maximum number of nudges
      if (nudgeCount >= (campaign.maxNudges || 1)) {
        continue;
      }

      // Check if the overall result is actually completed.
      // (CampaignRecipient doesn't always show completed if the engine didn't update it yet)
      if (recipient.resultId) {
        const result = await prisma.result.findUnique({
          where: { id: recipient.resultId },
          select: { isCompleted: true }
        });
        
        if (result?.isCompleted) {
          // They finished the bot, mark recipient as completed so we stop checking
          await prisma.campaignRecipient.update({
            where: { id: recipient.id },
            data: { status: RecipientStatus.COMPLETED }
          });
          continue;
        }
      }

      // Determine the last time they interacted
      const lastActivityTime = await getLastActivity(recipient.resultId, recipient.sentAt);
      const delayMs = campaign.nudgeDelaySeconds * 1000;

      // If they have been inactive longer than the delay, we nudge them
      if (now.getTime() - lastActivityTime.getTime() > delayMs) {
        console.log(`🚀 [NudgeScheduler] Scheduling nudge for recipient: ${recipient.id} (Delay passed: ${campaign.nudgeDelaySeconds}s)`);
        
        // Use a transaction to ensure we don't schedule twice for the same threshold
        await prisma.$transaction(async (tx) => {
          const nudge = await (tx as any).nudgeAttempt.create({
            data: {
              campaignRecipientId: recipient.id,
              sentAt: now,
            },
          });

          // TS ignore for update because Prisma might not be completely regenerated across workspaces
          await (tx.campaignRecipient as any).update({
            where: { id: recipient.id },
            data: { nudgeStatus: "SENT" },
          });

          await publishNudgeJob({
            nudgeId: nudge.id,
            recipientId: recipient.id,
            campaignId: campaign.id,
            phoneNumber: recipient.phoneNumber,
          });
        });

        nudgesScheduled++;
      }
    }

    if (nudgesScheduled > 0) {
      console.log(`✅ [NudgeScheduler] Scheduled ${nudgesScheduled} nudges.`);
    }

  } catch (error) {
    console.error("❌ [NudgeScheduler] Error processing nudges:", error);
  }
};

/**
 * Helper to determine the last time the user interacted with the bot.
 * We look at the latest AnswerV2. If no answers, we fall back to when the message was sent.
 */
const getLastActivity = async (resultId: string | null, sentAt: Date | null): Promise<Date> => {
  if (!resultId) {
    return sentAt ?? new Date(0);
  }

  const lastAnswer = await prisma.answerV2.findFirst({
    where: { resultId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  if (lastAnswer) {
    return lastAnswer.createdAt;
  }

  return sentAt ?? new Date(0);
};
