import { CampaignStatus, RecipientStatus } from "@prisma/client";
import { env } from "@typebot.io/env";
import prisma from "@typebot.io/prisma";
import { config } from "./config";

/**
 * --- Phase 2: Decoupled Campaign Analytics Architecture ---
 *
 * This module runs as a background worker. Instead of hooking directly into
 * the core Bot Engine (like `resumeWhatsAppFlow` or `saveStateToDatabase`),
 * which causes session conflicts and stalls, this module passively tracks analytics.
 *
 * How it works:
 * 1. `main.ts` creates a CampaignRecipient with a `resultId` when a message is sent.
 * 2. This tracker polls the permanent `Result` table using that `resultId`.
 * 3. It checks for `hasStarted` (user replied) and `isCompleted` (flow ended).
 * 4. It checks the `AnswerV2` table for the NPS block result.
 * 5. It syncs these metrics back to the `CampaignRecipient` table safely.
 */

// Find NPS or Rating blocks from the typebot groups
const extractNpsConfig = (typebot: any) => {
  const groups =
    (typebot.publishedTypebot && typebot.publishedTypebot.groups) ||
    typebot.groups ||
    [];

  for (const group of groups) {
    for (const block of group.blocks) {
      if (block.type === "nps input" || block.type === "rating input") {
        return { blockId: block.id };
      }
    }
  }
  return null;
};

const trackStartedRecipients = async () => {
  // Find recipients that have a resultId but haven't been marked as started yet
  const recipients = await prisma.campaignRecipient.findMany({
    where: {
      resultId: { not: null },
      startedAt: null,
      status: { notIn: [RecipientStatus.PENDING, RecipientStatus.QUEUED] },
      // Include COMPLETED campaigns too — the completionChecker marks a campaign
      // as COMPLETED once all messages are SENT, but users may still be mid-flow.
      campaign: {
        status: { in: [CampaignStatus.RUNNING, CampaignStatus.COMPLETED] },
      },
    },
    take: 100, // Process in batches
    select: { id: true, resultId: true, phoneNumber: true },
  });

  if (recipients.length === 0) return;

  for (const recipient of recipients) {
    if (!recipient.resultId) continue;

    const result = await prisma.result.findUnique({
      where: { id: recipient.resultId },
      select: { hasStarted: true, createdAt: true },
    });

    if (result?.hasStarted) {
      await prisma.campaignRecipient.update({
        where: { id: recipient.id },
        data: { startedAt: new Date() }, // Or ideally use the first answer's timestamp if needed, but new Date() works for polling
      });
      console.log(
        `📈 Analytics: Recipient ${recipient.phoneNumber} STARTED flow.`,
      );
    }
  }
};

const trackCompletedRecipients = async () => {
  // Find recipients that have started but haven't completed
  const recipients = await prisma.campaignRecipient.findMany({
    where: {
      resultId: { not: null },
      startedAt: { not: null },
      completedAt: null,
      // Include COMPLETED campaigns too — same reason as trackStartedRecipients.
      campaign: {
        status: { in: [CampaignStatus.RUNNING, CampaignStatus.COMPLETED] },
      },
    },
    take: 100,
    select: { id: true, resultId: true, phoneNumber: true },
  });

  if (recipients.length === 0) return;

  for (const recipient of recipients) {
    if (!recipient.resultId) continue;

    const result = await prisma.result.findUnique({
      where: { id: recipient.resultId },
      select: { isCompleted: true },
    });

    if (result?.isCompleted) {
      await prisma.campaignRecipient.update({
        where: { id: recipient.id },
        data: {
          completedAt: new Date(),
          status: RecipientStatus.COMPLETED,
        },
      });
      console.log(
        `✅ Analytics: Recipient ${recipient.phoneNumber} COMPLETED flow.`,
      );
    }
  }
};

const trackNpsScores = async () => {
  // Find recipients that completed the flow but have no NPS score yet
  const recipients = await prisma.campaignRecipient.findMany({
    where: {
      resultId: { not: null },
      completedAt: { not: null },
      npsScore: null,
    },
    take: 100,
    select: {
      id: true,
      resultId: true,
      phoneNumber: true,
      campaign: {
        select: {
          typebot: {
            select: {
              groups: true,
              publishedTypebot: {
                select: { groups: true },
              },
            },
          },
        },
      },
    },
  });

  if (recipients.length === 0) return;

  for (const recipient of recipients) {
    if (!recipient.resultId) continue;

    const npsConfig = extractNpsConfig(recipient.campaign.typebot);
    if (!npsConfig?.blockId) {
      // Typebot has no NPS block, so we set a dummy value or mark it to skip future checks.
      // Easiest is to set npsScore to -1 (if Prisma SmallInt allows it) or just ignore,
      // but to avoid infinite polling, let's mark npsRespondedAt = new Date() while npsScore remains null
      await prisma.campaignRecipient.update({
        where: { id: recipient.id },
        data: { npsRespondedAt: new Date() },
      });
      continue;
    }

    const answer = await prisma.answerV2.findFirst({
      where: {
        resultId: recipient.resultId,
        blockId: npsConfig.blockId,
      },
      select: { content: true, createdAt: true },
    });

    if (answer && answer.content) {
      const score = parseInt(answer.content, 10);
      if (!isNaN(score)) {
        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: {
            npsScore: score,
            npsRespondedAt: answer.createdAt,
          },
        });
        console.log(
          `📊 Analytics: Recipient ${recipient.phoneNumber} gave NPS ${score}.`,
        );
      }
    } else {
      // Mark as checked so we don't infinitely poll if they completed but skipped NPS block
      await prisma.campaignRecipient.update({
        where: { id: recipient.id },
        data: { npsRespondedAt: new Date() },
      });
    }
  }
};

export const runAnalyticsTracker = async () => {
  console.log("📈 Analytics Tracker starting...");

  const poll = async () => {
    try {
      if (env.ENABLE_EVENT_DRIVEN_CAMPAIGN_ANALYTICS) {
        return; // Skip polling when event-driven analytics is active
      }
      await trackStartedRecipients();
      await trackCompletedRecipients();
      await trackNpsScores();
    } catch (error) {
      console.error("❌ Analytics tracker error:", error);
    }
  };

  await poll();

  setInterval(poll, config.analyticsTracker.pollIntervalMs);

  console.log(
    `📈 Analytics Tracker running, polling every ${config.analyticsTracker.pollIntervalMs}ms`,
  );
};
