import { TRPCError } from "@trpc/server";
import { RecipientStatus } from "@prisma/client";
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

    // Fetch all recipients for this campaign
    const recipients = await prisma.campaignRecipient.findMany({
      where: { campaignId },
      select: { status: true },
    });

    const total = recipients.length;

    // Count recipients by status
    const statusCounts = recipients.reduce(
      (acc, recipient) => {
        acc[recipient.status] = (acc[recipient.status] || 0) + 1;
        return acc;
      },
      {} as Record<RecipientStatus, number>,
    );

    // Calculate metrics
    const pending = statusCounts[RecipientStatus.PENDING] || 0;
    const queued = statusCounts[RecipientStatus.QUEUED] || 0;
    const sent = statusCounts[RecipientStatus.SENT] || 0;
    const delivered = statusCounts[RecipientStatus.DELIVERED] || 0;
    const opened = statusCounts[RecipientStatus.OPENED] || 0;
    const started = statusCounts[RecipientStatus.STARTED] || 0;
    const completed = statusCounts[RecipientStatus.COMPLETED] || 0;
    const failed = statusCounts[RecipientStatus.FAILED] || 0;

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
