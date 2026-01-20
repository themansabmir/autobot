import { TRPCError } from "@trpc/server";
import prisma from "@typebot.io/prisma";
import type { Prisma } from "@typebot.io/prisma/types";
import {
  campaignExecutionModeSchema,
  campaignSchema,
} from "@typebot.io/schemas/features/campaign";
import { z } from "@typebot.io/zod";
import { getUserModeInWorkspace } from "@/features/workspace/helpers/getUserRoleInWorkspace";
import { authenticatedProcedure } from "@/helpers/server/trpc";

export const createCampaign = authenticatedProcedure
  .meta({
    openapi: {
      method: "POST",
      path: "/v1/campaigns",
      protect: true,
      summary: "Create a campaign",
      tags: ["Campaign"],
    },
  })
  .input(
    z.object({
      workspaceId: z.string(),
      title: z.string(),
      fileUrl: z.string(),
      typebotId: z.string(),
      executionMode: campaignExecutionModeSchema,
      executeAt: z.string().datetime().optional(),
    }),
  )
  .output(
    z.object({
      campaign: campaignSchema,
    }),
  )
  .mutation(
    async ({
      input: {
        workspaceId,
        title,
        fileUrl,
        typebotId,
        executionMode,
        executeAt,
      },
      ctx: { user },
    }) => {
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

      const status = executionMode === "NOW" ? "PENDING" : "SCHEDULED";

      const newCampaign = await prisma.campaign.create({
        data: {
          workspaceId,
          title,
          fileUrl,
          typebotId,
          executionMode,
          executeAt: executeAt ? new Date(executeAt) : null,
          status,
        } satisfies Partial<Prisma.Campaign>,
      });

      // await trackEvents([
      //   {
      //     name: "Campaign created",
      //     userId: user.id,
      //     workspaceId,
      //   },
      // ]);

      return { campaign: campaignSchema.parse(newCampaign) };
    },
  );
