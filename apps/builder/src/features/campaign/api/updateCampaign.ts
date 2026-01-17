import { TRPCError } from "@trpc/server";
import prisma from "@typebot.io/prisma";
import {
  campaignExecutionModeSchema,
  campaignSchema,
} from "@typebot.io/schemas/features/campaign";
import { z } from "@typebot.io/zod";
import { getUserModeInWorkspace } from "@/features/workspace/helpers/getUserRoleInWorkspace";
import { authenticatedProcedure } from "@/helpers/server/trpc";

export const updateCampaign = authenticatedProcedure
  .meta({
    openapi: {
      method: "PATCH",
      path: "/v1/campaigns/{campaignId}",
      protect: true,
      summary: "Update a campaign",
      tags: ["Campaign"],
    },
  })
  .input(
    z.object({
      campaignId: z.string(),
      workspaceId: z.string(),
      campaign: z
        .object({
          title: z.string(),
          fileUrl: z.string(),
          executionMode: campaignExecutionModeSchema,
          executeAt: z.string().datetime().nullable(),
        })
        .partial(),
    }),
  )
  .output(
    z.object({
      campaign: campaignSchema,
    }),
  )
  .mutation(
    async ({ input: { campaign, campaignId, workspaceId }, ctx: { user } }) => {
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

      const existingCampaign = await prisma.campaign.findUnique({
        where: { id: campaignId, workspaceId },
      });

      if (!existingCampaign)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign not found",
        });

      const updatedCampaign = await prisma.campaign.update({
        where: {
          id: campaignId,
        },
        data: {
          title: campaign.title,
          fileUrl: campaign.fileUrl,
          executionMode: campaign.executionMode,
          executeAt: campaign.executeAt ? new Date(campaign.executeAt) : null,
        },
      });

      return { campaign: campaignSchema.parse(updatedCampaign) };
    },
  );
