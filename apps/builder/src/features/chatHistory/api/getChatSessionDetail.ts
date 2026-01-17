import { TRPCError } from "@trpc/server";
import { sessionStateSchema } from "@typebot.io/chat-session/schemas";
import prisma from "@typebot.io/prisma";
import { z } from "@typebot.io/zod";
import { authenticatedProcedure } from "@/helpers/server/trpc";

export const getChatSessionDetail = authenticatedProcedure
  .input(
    z.object({
      sessionId: z.string(),
      workspaceId: z.string(),
    }),
  )
  .output(
    z.object({
      session: z.object({
        id: z.string(),
        createdAt: z.date(),
        updatedAt: z.date(),
        typebotId: z.string(),
        typebotName: z.string(),
        messages: z.array(
          z.object({
            role: z.enum(["bot", "user"]),
            content: z.string(),
            createdAt: z.date().optional(),
          }),
        ),
      }),
    }),
  )
  .query(async ({ input, ctx: { user } }) => {
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

    const session = await prisma.chatSession.findUnique({
      where: {
        id: input.sessionId,
      },
    });

    if (!session)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Chat session not found",
      });

    try {
      const parsedState = sessionStateSchema.parse(session.state);
      const typebotId = parsedState.typebotsQueue[0]?.typebot.id;
      const resultId = parsedState.typebotsQueue[0]?.resultId;

      if (!typebotId)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Typebot not found in session",
        });

      const typebot = await prisma.typebot.findFirst({
        where: {
          id: typebotId,
          workspaceId: input.workspaceId,
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (!typebot)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Typebot not found",
        });

      const messages: Array<{
        role: "bot" | "user";
        content: string;
        createdAt?: Date;
      }> = [];

      if (resultId) {
        const result = await prisma.result.findFirst({
          where: {
            id: resultId,
            typebotId: typebot.id,
          },
          include: {
            answers: {
              orderBy: {
                createdAt: "asc",
              },
            },
            answersV2: {
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        });

        if (result) {
          const allAnswers = [
            ...result.answers.map((a) => ({
              content: a.content,
              createdAt: a.createdAt,
              blockId: a.blockId,
            })),
            ...result.answersV2.map((a) => ({
              content: a.content,
              createdAt: a.createdAt,
              blockId: a.blockId,
            })),
          ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

          allAnswers.forEach((answer) => {
            messages.push({
              role: "user",
              content: answer.content,
              createdAt: answer.createdAt,
            });
          });
        }
      }

      const answers = parsedState.typebotsQueue[0]?.answers || [];
      answers.forEach((answer) => {
        if (answer.value) {
          messages.push({
            role: "user",
            content:
              typeof answer.value === "string"
                ? answer.value
                : JSON.stringify(answer.value),
          });
        }
      });

      if (messages.length === 0) {
        messages.push({
          role: "bot",
          content: "Chat session started but no messages yet.",
        });
      }

      return {
        session: {
          id: session.id,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          typebotId: typebot.id,
          typebotName: typebot.name,
          messages,
        },
      };
    } catch (_error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to parse chat session",
      });
    }
  });
