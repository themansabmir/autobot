import { TRPCError } from "@trpc/server";
import prisma from "@typebot.io/prisma";
import { z } from "@typebot.io/zod";
import { authenticatedProcedure } from "@/helpers/server/trpc";
import { sessionStateSchema } from "@typebot.io/chat-session/schemas";

const MAX_LIMIT = 200;

export const getChatSessions = authenticatedProcedure
  .input(
    z.object({
      workspaceId: z.string(),
      limit: z.coerce.number().min(1).max(MAX_LIMIT).default(50),
      cursor: z.string().optional(),
      typebotId: z.string().optional(),
    }),
  )
  .output(
    z.object({
      chatSessions: z.array(
        z.object({
          id: z.string(),
          createdAt: z.date(),
          updatedAt: z.date(),
          typebotId: z.string(),
          typebotName: z.string(),
          resultId: z.string().optional(),
        }),
      ),
      nextCursor: z.string().nullish(),
    }),
  )
  .query(async ({ input, ctx: { user } }) => {
    const limit = Number(input.limit);
    if (limit < 1 || limit > MAX_LIMIT)
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `limit must be between 1 and ${MAX_LIMIT}`,
      });

    const workspace = await prisma.workspace.findUnique({
      where: {
        id: input.workspaceId,
      },
      select: {
        members: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (
      !workspace ||
      !workspace.members.some((member) => member.userId === user.id)
    )
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Workspace not found",
      });

    // Get all typebots in workspace first for efficient lookup
    const workspaceTypebots = await prisma.typebot.findMany({
      where: {
        workspaceId: input.workspaceId,
        ...(input.typebotId ? { id: input.typebotId } : {}),
      },
      select: {
        id: true,
        name: true,
      },
    });

    const typebotMap = new Map(
      workspaceTypebots.map((tb) => [tb.id, tb.name]),
    );

    // Fetch more sessions to account for filtering
    const chatSessions = await prisma.chatSession.findMany({
      take: limit * 3, // Fetch 3x to account for filtered sessions
      cursor: input.cursor ? { id: input.cursor } : undefined,
      skip: input.cursor ? 1 : 0,
      orderBy: {
        updatedAt: "desc",
      },
    });

    const validSessions: Array<{
      id: string;
      createdAt: Date;
      updatedAt: Date;
      typebotId: string;
      typebotName: string;
      resultId?: string;
    }> = [];

    for (const session of chatSessions) {
      if (validSessions.length >= limit) break;

      try {
        const parsedState = sessionStateSchema.parse(session.state);
        const typebotId = parsedState.typebotsQueue[0]?.typebot.id;
        const resultId = parsedState.typebotsQueue[0]?.resultId;

        if (!typebotId) continue;

        const typebotName = typebotMap.get(typebotId);
        if (!typebotName) continue; // Typebot not in workspace

        validSessions.push({
          id: session.id,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          typebotId,
          typebotName,
          resultId,
        });
      } catch (error) {
        // Skip sessions with invalid state
        continue;
      }
    }

    const nextCursor =
      validSessions.length === limit && chatSessions.length > validSessions.length
        ? validSessions[validSessions.length - 1]?.id
        : undefined;

    return {
      chatSessions: validSessions,
      nextCursor,
    };
  });
