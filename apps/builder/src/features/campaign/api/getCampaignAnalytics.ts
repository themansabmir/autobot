import { TRPCError } from "@trpc/server";
import prisma from "@typebot.io/prisma";
import { z } from "@typebot.io/zod";
import { getUserModeInWorkspace } from "@/features/workspace/helpers/getUserRoleInWorkspace";
import { authenticatedProcedure } from "@/helpers/server/trpc";

const campaignAnalyticsSchema = z.object({
  total: z.number(),
  initiated: z.number(),
  sent: z.number(),
  delivered: z.number(),
  opened: z.number(),
  started: z.number(),
  completed: z.number(),
  failed: z.number(),
  pending: z.number(),
  queued: z.number(),
  nps: z
    .object({
      score: z.number(),
      promoters: z.number(),
      passives: z.number(),
      detractors: z.number(),
      totalResponses: z.number(),
      responseRate: z.number(),
      distribution: z.record(z.string(), z.number()), // Zod record keys are strings usually, but mapping to number
      trend: z.array(
        z.object({
          date: z.string(),
          score: z.number(),
          responses: z.number(),
        }),
      ),
      scale: z.object({
        min: z.number(),
        max: z.number(),
      }),
    })
    .nullable(),
});

export const getCampaignAnalytics = authenticatedProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/v1/campaigns/{campaignId}/analytics",
      protect: true,
      summary: "Get campaign analytics",
      tags: ["Campaign"],
    },
  })
  .input(
    z.object({
      workspaceId: z.string(),
      campaignId: z.string(),
    }),
  )
  .output(
    z.object({
      analytics: campaignAnalyticsSchema,
    }),
  )
  .query(async ({ input: { workspaceId, campaignId }, ctx: { user } }) => {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true, members: true },
    });
    const userRole = getUserModeInWorkspace(user.id, workspace?.members);
    if (userRole === "guest" || !workspace)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Workspace not found",
      });

    const campaign = await prisma.campaign.findUnique({
      where: {
        id: campaignId,
        workspaceId,
      },
      include: {
        typebot: {
          select: {
            groups: true,
            publishedTypebot: {
              select: {
                groups: true,
              },
            },
          },
        },
      },
    });

    if (!campaign)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Campaign not found",
      });

    // Fetch all recipients for this campaign with timestamp fields
    const recipients = await prisma.campaignRecipient.findMany({
      where: { campaignId },
      select: {
        status: true,
        sentAt: true,
        deliveredAt: true,
        openedAt: true,
        startedAt: true,
        completedAt: true,
        failedAt: true,
        npsScore: true,
        npsRespondedAt: true,
      },
    });

    const total = recipients.length;

    // Count based on timestamp fields (cumulative, not overwriting)
    const sent = recipients.filter((r) => r.sentAt !== null).length;
    const delivered = recipients.filter((r) => r.deliveredAt !== null).length;
    const opened = recipients.filter((r) => r.openedAt !== null).length;
    const started = recipients.filter((r) => r.startedAt !== null).length;
    const completed = recipients.filter((r) => r.completedAt !== null).length;
    const failed = recipients.filter((r) => r.failedAt !== null).length;

    // Count current status for pending/queued
    const pending = recipients.filter((r) => r.status === "PENDING").length;
    const queued = recipients.filter((r) => r.status === "QUEUED").length;

    // Initiated = all non-pending recipients
    const initiated = total - pending;

    const npsScoresWithDate = recipients
      .filter((r) => r.npsScore !== null)
      .map((r) => ({
        score: r.npsScore!,
        date: r.npsRespondedAt ? r.npsRespondedAt.toISOString().split("T")[0] : null,
      }));

    // Extract NPS configuration from Typebot
    const npsConfig = extractNpsConfig(campaign.typebot);

    const npsAnalytics = calculateNPS(npsScoresWithDate, total, npsConfig);

    return {
      analytics: {
        total,
        initiated,
        sent,
        delivered,
        opened,
        started,
        completed,
        failed,
        pending,
        queued,
        nps: npsAnalytics,
      },
    };
  });

const extractNpsConfig = (typebot: any) => {
  const groups =
    (typebot.publishedTypebot && typebot.publishedTypebot.groups) ||
    typebot.groups ||
    [];

  for (const group of groups) {
    for (const block of group.blocks) {
      if (block.type === "nps" || block.type === "rating") {
        const startsAt =
          typeof block.options?.startsAt === "number"
            ? block.options.startsAt
            : 1; // Default to 1 as per user request
        const length = block.options?.length ?? 10;
        return {
          min: startsAt,
          max: startsAt + length - 1,
        };
      }
    }
  }
  return { min: 1, max: 10 }; // Default fallback
};

function calculateNPS(
  scores: { score: number; date: string | null }[],
  totalRecipients: number,
  scale: { min: number; max: number },
) {
  if (scores.length === 0) return null;

  const scoreValues = scores.map((s) => s.score);
  const totalResponses = scores.length;

  // Normalize scores to 0-10 scale for calculating NPS buckets
  // Formula: ((score - min) / (max - min)) * 10
  // Standard NPS (0-10): Promoters (9-10), Passives (7-8), Detractors (0-6)
  const normalizedScores = scoreValues.map((s) => {
    if (scale.max === scale.min) return 10; // Avoid division by zero
    return ((s - scale.min) / (scale.max - scale.min)) * 10;
  });

  const promoters = normalizedScores.filter((s) => s >= 9).length;
  const passives = normalizedScores.filter((s) => s >= 7 && s < 9).length;
  const detractors = normalizedScores.filter((s) => s < 7).length;

  // NPS Formula: (Promoters - Detractors) / Total * 100
  // This metric represents the "Net" sentiment. Ranges from -100 to 100.
  const npsScore = ((promoters - detractors) / totalResponses) * 100;

  // Calculate Distribution (Scale Min to Max)
  const distribution: Record<number, number> = {};
  for (let i = scale.min; i <= scale.max; i++) distribution[i] = 0;
  scoreValues.forEach((s) => {
    // Only count if within current scale range to avoid artifacts from old scales
    if (s >= scale.min && s <= scale.max) {
      if (distribution[s] !== undefined) distribution[s]++;
    }
  });

  // Calculate Trend (Daily)
  const trendMap = new Map<
    string,
    { promoters: number; detractors: number; total: number }
  >();

  scores.forEach(({ score, date }) => {
    if (!date) return;
    
    // Normalize individual score for trend bucket
    const s = ((score - scale.min) / (scale.max - scale.min)) * 10;

    const current = trendMap.get(date) || { promoters: 0, detractors: 0, total: 0 };
    if (s >= 9) current.promoters++;
    else if (s < 7) current.detractors++;
    current.total++;
    trendMap.set(date, current);
  });

  // Sort by date and format
  const trend = Array.from(trendMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, data]) => ({
      date,
      score: Math.round(((data.promoters - data.detractors) / data.total) * 100),
      responses: data.total,
    }));

  return {
    score: Math.round(npsScore),
    promoters,
    passives,
    detractors,
    totalResponses,
    responseRate: (totalResponses / totalRecipients) * 100,
    distribution,
    trend,
    scale, // Pass scale to frontend
  };
}
