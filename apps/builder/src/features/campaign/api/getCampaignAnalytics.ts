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
        date: r.npsRespondedAt
          ? r.npsRespondedAt.toISOString().split("T")[0]
          : null,
      }));

    // Extract NPS configuration from Typebot — returns null if bot has no NPS/rating block
    const npsConfig = extractNpsConfig(campaign.typebot);

    // Only calculate NPS if the bot actually has an NPS/rating block
    const npsAnalytics = npsConfig
      ? calculateNPS(npsScoresWithDate, total, npsConfig)
      : null;

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
      if (block.type === "nps input" || block.type === "rating input") {
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
  return null; // No NPS/rating block found in this bot
};

function getNpsBucket(score: number, _min: number, max: number): "promoter" | "passive" | "detractor" {
  // Highly robust, O(1) dynamic scaling algorithm for ANY rating scale (e.g. 1-3, 1-7, 1-10)
  // Ensures ratings always evaluate relative to their max ceiling, eliminating hardcoded switch cases.
  
  // Promoters: Top tier, typically >= 80% of the maximum possible score
  if (score >= Math.ceil(max * 0.8)) return "promoter";
  
  // Passives: Middle tier, typically >= 50% of the maximum possible score
  if (score >= Math.ceil(max * 0.5)) return "passive";
  
  // Detractors: Bottom tier falling below 50%
  return "detractor";
}

function calculateNPS(
  scores: { score: number; date: string | null }[],
  totalRecipients: number,
  scale: { min: number; max: number },
) {
  // Always return a full NPS object so the frontend renders the widget
  // even with no data — empty state is better UX than hiding the entire section.
  if (scores.length === 0)
    return {
      score: 0,
      promoters: 0,
      passives: 0,
      detractors: 0,
      totalResponses: 0,
      responseRate: 0,
      distribution: Object.fromEntries(
        Array.from({ length: scale.max - scale.min + 1 }, (_, i) => [
          scale.min + i,
          0,
        ]),
      ),
      trend: [],
      scale,
    };

  const scoreValues = scores.map((s) => s.score);
  const totalResponses = scores.length;

  // Calculate Dynamic Buckets
  const buckets = scoreValues.map((s) => getNpsBucket(s, scale.min, scale.max));
  const promoters = buckets.filter((b) => b === "promoter").length;
  const passives = buckets.filter((b) => b === "passive").length;
  const detractors = buckets.filter((b) => b === "detractor").length;

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

    // Use dynamic bucket helper for trend accuracy
    const bucket = getNpsBucket(score, scale.min, scale.max);

    const current = trendMap.get(date) || {
      promoters: 0,
      detractors: 0,
      total: 0,
    };
    if (bucket === "promoter") current.promoters++;
    else if (bucket === "detractor") current.detractors++;
    current.total++;
    trendMap.set(date, current);
  });

  // Sort by date and format
  const trend = Array.from(trendMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, data]) => ({
      date,
      score: Math.round(
        ((data.promoters - data.detractors) / data.total) * 100,
      ),
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
