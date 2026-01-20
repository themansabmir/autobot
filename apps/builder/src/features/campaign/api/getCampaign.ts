import { TRPCError } from "@trpc/server";
import prisma from "@typebot.io/prisma";
import { campaignSchema } from "@typebot.io/schemas/features/campaign";
import { z } from "@typebot.io/zod";
import { getUserModeInWorkspace } from "@/features/workspace/helpers/getUserRoleInWorkspace";
import { authenticatedProcedure } from "@/helpers/server/trpc";

export const getCampaign = authenticatedProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/v1/campaigns/{campaignId}",
      protect: true,
      summary: "Get campaign",
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
      campaign: campaignSchema,
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

    return { campaign };
  });
