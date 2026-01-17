import { TRPCError } from "@trpc/server";
import prisma from "@typebot.io/prisma";
import { campaignSchema } from "@typebot.io/schemas/features/campaign";
import { z } from "@typebot.io/zod";
import { getUserModeInWorkspace } from "@/features/workspace/helpers/getUserRoleInWorkspace";
import { authenticatedProcedure } from "@/helpers/server/trpc";

export const listCampaigns = authenticatedProcedure
  .meta({
    openapi: {
      method: "GET",
      path: "/v1/campaigns",
      protect: true,
      summary: "List campaigns",
      tags: ["Campaign"],
    },
  })
  .input(
    z.object({
      workspaceId: z.string(),
    }),
  )
  .output(
    z.object({
      campaigns: z.array(campaignSchema),
    }),
  )
  .query(async ({ input: { workspaceId }, ctx: { user } }) => {
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

    const campaigns = await prisma.campaign.findMany({
      where: {
        workspaceId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { campaigns };
  });
