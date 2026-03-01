import type { Message, StartFrom } from "@typebot.io/chat-api/schemas";
import type { SessionState } from "@typebot.io/chat-session/schemas";
import type { SessionStore } from "@typebot.io/runtime-session-store";
import type { SetVariableHistoryItem } from "@typebot.io/variables/schemas";
import { continueBotFlow } from "./continueBotFlow";
import { getStartingPoint } from "./getStartingPoint";
import { upsertResult } from "./queries/upsertResult";
import type { ContinueBotFlowResponse } from "./types";
import { walkFlowForward } from "./walkFlowForward";
import { loadTranslatedJourney } from "./i18n";

type Props = {
  version: 1 | 2;
  message: Message | undefined;
  state: SessionState;
  startFrom?: StartFrom;
  textBubbleContentFormat: "richText" | "markdown";
  sessionStore: SessionStore;
};

export const startBotFlow = async ({
  version,
  message,
  state,
  sessionStore,
  startFrom,
  textBubbleContentFormat,
}: Props): Promise<ContinueBotFlowResponse> => {
  let newSessionState = state;
  const setVariableHistory: SetVariableHistoryItem[] = [];

  // If language is already set in the state, load the translated journey
  if (newSessionState.language && newSessionState.typebotsQueue[0]) {
    try {
      console.log(`[i18n] Initial load: using language ${newSessionState.language}`);
      const translatedTypebot = await loadTranslatedJourney(
        newSessionState.typebotsQueue[0].typebot.id,
        newSessionState.language,
        newSessionState.typebotsQueue[0].typebot,
      );
      
      newSessionState = {
        ...newSessionState,
        typebotsQueue: newSessionState.typebotsQueue.map((item, index) =>
          index === 0 ? { ...item, typebot: translatedTypebot } : item
        ),
      };
    } catch (error) {
      console.error("[i18n] Initial load translated journey failed:", error);
    }
  }

  const startingPoint = getStartingPoint({
    typebot: newSessionState.typebotsQueue[0]?.typebot,
    startFrom,
  });
  if (!startingPoint)
    return {
      messages: [],
      newSessionState,
      setVariableHistory: [],
      visitedEdges: [],
    };

  const chatReply = await walkFlowForward(startingPoint, {
    version,
    state: newSessionState,
    sessionStore,
    setVariableHistory,
    textBubbleContentFormat,
  });

  return autoContinueChatIfStartingWithInput({
    message,
    state: newSessionState,
    chatReply,
    textBubbleContentFormat,
    version,
    sessionStore,
  });
};

const autoContinueChatIfStartingWithInput = async ({
  version,
  message,
  chatReply,
  textBubbleContentFormat,
  sessionStore,
}: Props & {
  chatReply: ContinueBotFlowResponse;
}): Promise<ContinueBotFlowResponse> => {
  if (
    !message ||
    chatReply.messages.length > 0 ||
    (chatReply.clientSideActions?.filter((c) => c.expectsDedicatedReply)
      .length ?? 0) > 0
  )
    return chatReply;

  const resultId = chatReply.newSessionState.typebotsQueue[0].resultId;
  if (resultId)
    await upsertResult({
      hasStarted: true,
      isCompleted: false,
      resultId,
      typebot: chatReply.newSessionState.typebotsQueue[0].typebot,
    });
  return continueBotFlow(message, {
    version,
    state: chatReply.newSessionState,
    textBubbleContentFormat: textBubbleContentFormat,
    sessionStore,
  });
};
