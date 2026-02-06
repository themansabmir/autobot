import { TRPCError } from "@trpc/server";
import type { RecipientStatus } from "@typebot.io/schemas/features/campaign";
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
      },
    };
  });
