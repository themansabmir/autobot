import { saveStateToDatabase } from "@typebot.io/bot-engine/saveStateToDatabase";
import { startSession } from "@typebot.io/bot-engine/startSession";
import type { StartFrom } from "@typebot.io/chat-api/schemas";
import type { SessionState } from "@typebot.io/chat-session/schemas";
import type { WhatsAppCredentials } from "@typebot.io/credentials/schemas";
import { getSessionStore } from "@typebot.io/runtime-session-store";
import { sendChatReplyToWhatsApp } from "./sendChatReplyToWhatsApp";

type Props = {
  to: string;
  sessionId: string;
  typebot: {
    id: string;
    publicId?: string | null;
  };
  credentials: WhatsAppCredentials["data"];
  params: {
    type: "live" | "preview";
    isOnlyRegistering?: boolean;
    prefilledVariables?: Record<string, unknown>;
    startFrom?: StartFrom;
    userId?: string;
  };
  initialSessionState?: Pick<SessionState, "whatsApp" | "expiryTimeout">;
};

export const initiateWhatsAppFlow = async ({
  to,
  sessionId,
  typebot,
  credentials,
  params,
  initialSessionState,
}: Props) => {
  const sessionStore = getSessionStore(sessionId);

  const startParams =
    params.type === "preview"
      ? {
          type: "preview" as const,
          typebotId: typebot.id,
          isOnlyRegistering: params.isOnlyRegistering ?? false,
          isStreamEnabled: false,
          textBubbleContentFormat: "richText" as const,
          prefilledVariables: params.prefilledVariables,
          startFrom: params.startFrom,
          userId: params.userId,
        }
      : {
          type: "live" as const,
          publicId: typebot.publicId as string,
          isOnlyRegistering: params.isOnlyRegistering ?? false,
          isStreamEnabled: false,
          textBubbleContentFormat: "richText" as const,
          prefilledVariables: params.prefilledVariables,
        };

  const startResponse = await startSession({
    version: 2,
    startParams,
    initialSessionState,
    sessionStore,
  });

  const result = await sendChatReplyToWhatsApp({
    to,
    sessionId,
    messages: startResponse.messages,
    input: startResponse.input,
    isFirstChatChunk: true,
    clientSideActions: startResponse.clientSideActions,
    credentials,
    state: startResponse.newSessionState,
  });

  await saveStateToDatabase({
    sessionId: {
      type: "new",
      id: sessionId,
    },
    session: {
      state: startResponse.newSessionState,
    },

    input: startResponse.input,
    logs: startResponse.logs,
    clientSideActions: startResponse.clientSideActions,
    visitedEdges: startResponse.visitedEdges,
    setVariableHistory: startResponse.setVariableHistory,
  });

  return {
    startResponse,
    result,
  };
};
