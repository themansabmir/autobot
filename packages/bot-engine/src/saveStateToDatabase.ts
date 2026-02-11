import { env } from "@typebot.io/env";
import type { ContinueChatResponse } from "@typebot.io/chat-api/schemas";
import { updateSession } from "@typebot.io/chat-session/queries/updateSession";
import { upsertSession } from "@typebot.io/chat-session/queries/upsertSession";
import type { ChatSession } from "@typebot.io/chat-session/schemas";
import prisma from "@typebot.io/prisma";
import type { Prisma } from "@typebot.io/prisma/types";
import type { SetVariableHistoryItem } from "@typebot.io/variables/schemas";
import { upsertResult } from "./queries/upsertResult";
import { RecipientStatus } from "@typebot.io/prisma/enum";
import { InputBlockType } from "@typebot.io/blocks-inputs/constants";
import { isInputBlock, blockHasOptions } from "@typebot.io/blocks-core/helpers";

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

  // Check if enhanced analytics is enabled
  // Check if enhanced analytics is enabled (Default to true for this user fix)
  const isEnhancedAnalyticsEnabled =
    env.ENABLE_ENHANCED_CAMPAIGN_ANALYTICS !== false;

  if (state.whatsApp?.contact?.phoneNumber && state.typebotsQueue[0]?.typebot?.id) {
     const phoneNumber = state.whatsApp.contact.phoneNumber;
     const typebotId = state.typebotsQueue[0].typebot.id;

     // NPS Saving Logic
     const lastAnswer = state.typebotsQueue[0].answers?.at(-1);
     if (lastAnswer && isEnhancedAnalyticsEnabled) {
       // Answer format is { key: string, value: string }
       // Key is either Variable Name or Group Title
       const typebot = state.typebotsQueue[0].typebot;
       let npsBlockFound = false;
       let npsScore: number | undefined;

       // Attempt 1: Match by Variable
       const variable = typebot.variables.find((v) => v.name === lastAnswer.key);
       if (variable) {
          // Find block using this variable
          for (const group of typebot.groups) {
             for (const block of group.blocks) {
                if (
                  isInputBlock(block) &&
                  blockHasOptions(block) &&
                  block.options &&
                  "variableId" in block.options &&
                  block.options.variableId === variable.id &&
                  block.type === InputBlockType.NPS
                ) {
                   npsBlockFound = true;
                   break;
                }
             }
             if (npsBlockFound) break;
          }
       }

       // Attempt 2: Match by Group Title (including "Title (1)" suffix handling)
       if (!npsBlockFound) {
          let groupKey = lastAnswer.key;
          // Handle "Title (1)" format which continueBotFlow adds for repeated inputs
          const match = groupKey.match(/^(.+) \(\d+\)$/);
          if (match) {
            console.log(`ℹ️ [Campaign Analytics] normalizing group key: "${groupKey}" -> "${match[1]}"`);
            groupKey = match[1];
          }

          const group = typebot.groups.find((g) => g.title === groupKey);
          if (group) {
             // Find input block in group
             for (const block of group.blocks) {
                if (isInputBlock(block) && block.type === InputBlockType.NPS) {
                   npsBlockFound = true;
                   break;
                }
             }
          }
       }

       if (npsBlockFound) {
          npsScore = parseInt(lastAnswer.value);
          // User requested 1-10 range specifically
          if (!isNaN(npsScore) && npsScore >= 1 && npsScore <= 10) {
                   console.log(`✅ [Campaign Analytics] Found NPS score: ${npsScore} for ${phoneNumber}`);
               const recipient = await prisma.campaignRecipient.findFirst({
                  where: {
                    phoneNumber,
                    campaign: { typebotId },
                  },
                  orderBy: { createdAt: "desc" },
                });
               if (recipient) {
                 console.log(`🔄 [Campaign Analytics] Updating recipient ${recipient.id} with NPS: ${npsScore}`);
                 queries.push(
                    prisma.campaignRecipient.update({
                      where: { id: recipient.id },
                      data: {
                        npsScore,
                        npsRespondedAt: new Date(),
                      },
                    })
                 );
               } else {
                 console.warn(`⚠️ [Campaign Analytics] No recipient found for ${phoneNumber} to update NPS.`);
               }
          }
       }
     }

     if (
        isCompleted &&
        isEnhancedAnalyticsEnabled
      ) {
    
    // Find the latest recipient for this user & bot
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
      ).includes(recipient.status as RecipientStatus)
    ) {
      console.log(`🔄 [Campaign Analytics] Marking recipient ${recipient.id} as COMPLETED. Previous status: ${recipient.status}`);
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
    } else if (!recipient) {
        console.warn(`⚠️ [Campaign Analytics] Session completed but no recipient found for ${phoneNumber}`);
    } else {
        console.log(`ℹ️ [Campaign Analytics] Session completed but recipient ${recipient.id} status is already ${recipient.status} (Not updating)`);
    }
    }
}

  await prisma.$transaction(queries);

  return session;
};
