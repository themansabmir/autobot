import { TRPCError } from "@trpc/server";
import prisma from "@typebot.io/prisma";
import { campaignSchema } from "@typebot.io/schemas/features/campaign";
import { z } from "@typebot.io/zod";
import { getUserModeInWorkspace } from "@/features/workspace/helpers/getUserRoleInWorkspace";
import { authenticatedProcedure } from "@/helpers/server/trpc";

export const deleteCampaign = authenticatedProcedure
  .meta({
    openapi: {
      method: "DELETE",
      path: "/v1/campaigns/{campaignId}",
      protect: true,
      summary: "Delete a campaign",
      tags: ["Campaign"],
    },
  })
  .input(
    z.object({
      campaignId: z.string(),
      workspaceId: z.string(),
    }),
  )
  .output(
    z.object({
      campaign: campaignSchema,
    }),
  )
  .mutation(async ({ input: { campaignId, workspaceId }, ctx: { user } }) => {
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

    const campaign = await prisma.campaign.delete({
      where: {
        id: campaignId,
      },
    });

    return { campaign };
  });
