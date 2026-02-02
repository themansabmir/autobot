import { RecipientStatus } from "@prisma/client";
import type { ContinueChatResponse } from "@typebot.io/chat-api/schemas";
import { updateSession } from "@typebot.io/chat-session/queries/updateSession";
import { upsertSession } from "@typebot.io/chat-session/queries/upsertSession";
import type { ChatSession } from "@typebot.io/chat-session/schemas";
import prisma from "@typebot.io/prisma";
import type { Prisma } from "@typebot.io/prisma/types";
import type { SetVariableHistoryItem } from "@typebot.io/variables/schemas";
import { upsertResult } from "./queries/upsertResult";

type Props = {
  session: Pick<ChatSession, "state"> & { id?: string };
  input: ContinueChatResponse["input"];
  logs: ContinueChatResponse["logs"];
  clientSideActions: ContinueChatResponse["clientSideActions"];
  visitedEdges: Prisma.VisitedEdge[];
  setVariableHistory: SetVariableHistoryItem[];
  isWaitingForExternalEvent?: boolean;
  initialSessionId?: string;
  sessionId: {
    type: "existing" | "new";
    id: string;
  };
};

export const saveStateToDatabase = async ({
  sessionId,
  session: { state },
  input,
  logs,
  clientSideActions,
  visitedEdges,
  setVariableHistory,
  isWaitingForExternalEvent,
}: Props) => {
  const containsSetVariableClientSideAction = clientSideActions?.some(
    (action) => action.expectsDedicatedReply,
  );

  const isCompleted = Boolean(
    !input &&
      !containsSetVariableClientSideAction &&
      !isWaitingForExternalEvent,
  );

  const queries: Prisma.PrismaPromise<any>[] = [];

  const resultId = state.typebotsQueue[0].resultId;

  if (sessionId.type === "existing") {
    // MODIFIED: Keep completed sessions for data analytics instead of deleting them
    // When session is completed, always set isReplying to false to allow new conversations
    const shouldSetReplyingFalse = isCompleted || !isWaitingForExternalEvent;

    console.log("🔄 [DEBUG] Updating existing session:", sessionId.id, {
      isCompleted,
      hasState: !!state,
      currentBlockId: state.currentBlockId,
      isReplying: shouldSetReplyingFalse
        ? false
        : (isWaitingForExternalEvent ?? false),
    });
    queries.push(
      updateSession({
        id: sessionId.id,
        state,
        isReplying: shouldSetReplyingFalse
          ? false
          : (isWaitingForExternalEvent ?? false),
      }),
    );
  }

  const session =
    sessionId.type === "existing"
      ? { state, id: sessionId.id }
      : await upsertSession(sessionId.id, {
          state,
          isReplying: isWaitingForExternalEvent ?? false,
        });

  console.log("💾 [DEBUG] Session object prepared:", {
    sessionId: session.id,
    type: sessionId.type,
    hasState: !!session.state,
  });

  if (!resultId) {
    if (queries.length > 0) await prisma.$transaction(queries);
    return session;
  }

  const answers = state.typebotsQueue[0].answers;

  queries.push(
    upsertResult({
      resultId,
      typebot: state.typebotsQueue[0].typebot,
      isCompleted: Boolean(
        !input && !containsSetVariableClientSideAction && answers.length > 0,
      ),
      hasStarted: answers.length > 0,
      lastChatSessionId: session.id,
      logs,
      visitedEdges,
      setVariableHistory,
    }),
  );

  if (
    isCompleted &&
    state.whatsApp?.contact?.phoneNumber &&
    state.typebotsQueue[0]?.typebot?.id
  ) {
    const phoneNumber = state.whatsApp.contact.phoneNumber;
    const typebotId = state.typebotsQueue[0].typebot.id;
    const recipient = await prisma.campaignRecipient.findFirst({
      where: {
        phoneNumber,
        campaign: {
          typebotId,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (
      recipient &&
      (
        [
          RecipientStatus.SENT,
          RecipientStatus.DELIVERED,
          RecipientStatus.OPENED,
          RecipientStatus.STARTED,
          RecipientStatus.QUEUED,
        ] as RecipientStatus[]
      ).includes(recipient.status)
    ) {
      queries.push(
        prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: {
            status: RecipientStatus.COMPLETED,
            completedAt: new Date(),
          },
        }),
      );
      console.log(
        `✅ [Campaign Analytics] Recipient ${recipient.id} (${recipient.phoneNumber}) status updated to COMPLETED`,
      );
    }
  }

  await prisma.$transaction(queries);

  return session;
};
