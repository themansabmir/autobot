import { RecipientStatus } from "@prisma/client";
import type { Block } from "@typebot.io/blocks-core/schemas/schema";
import { InputBlockType } from "@typebot.io/blocks-inputs/constants";
import { continueBotFlow } from "@typebot.io/bot-engine/continueBotFlow";
import { saveStateToDatabase } from "@typebot.io/bot-engine/saveStateToDatabase";
import type { Message } from "@typebot.io/chat-api/schemas";
import { getSession } from "@typebot.io/chat-session/queries/getSession";
import { upsertSession } from "@typebot.io/chat-session/queries/upsertSession";
import type { SessionState } from "@typebot.io/chat-session/schemas";
import { decrypt } from "@typebot.io/credentials/decrypt";
import { getCredentials } from "@typebot.io/credentials/getCredentials";
import type { WhatsAppCredentials } from "@typebot.io/credentials/schemas";
import { env } from "@typebot.io/env";
import { getBlockById } from "@typebot.io/groups/helpers/getBlockById";
import { extensionFromMimeType } from "@typebot.io/lib/extensionFromMimeType";
import redis from "@typebot.io/lib/redis";
import { uploadFileToBucket } from "@typebot.io/lib/s3/uploadFileToBucket";
import { isDefined } from "@typebot.io/lib/utils";
import prisma from "@typebot.io/prisma";
import {
  deleteSessionStore,
  getSessionStore,
  type SessionStore,
} from "@typebot.io/runtime-session-store";
import { downloadMedia } from "./downloadMedia";
import type {
  WhatsAppIncomingMessage,
  WhatsAppMessageReferral,
} from "./schemas";
import { sendChatReplyToWhatsApp } from "./sendChatReplyToWhatsApp";
import {
  messageMatchStartCondition,
  startWhatsAppSession,
} from "./startWhatsAppSession";
import { WhatsAppError } from "./WhatsAppError";

const MESSAGE_TOO_OLD_ELAPSED_MS = 24 * 60 * 60 * 1000; // 24 hours (was 3 minutes - too short for campaigns)
const INCOMING_MEDIA_MESSAGE_DEBOUNCE = 3_000;

type Props = {
  receivedMessages: WhatsAppIncomingMessage[];
  sessionId: string;
  credentialsId?: string;
  phoneNumberId?: string;
  workspaceId?: string;
  contact?: NonNullable<SessionState["whatsApp"]>["contact"];
  referral?: WhatsAppMessageReferral;
  callFrom?: "webhook";
};

const areMessagesTooOld = (receivedMessages: WhatsAppIncomingMessage[]) => {
  return receivedMessages.every(
    (message) =>
      new Date(Number(message.timestamp) * 1000).getTime() <
      Date.now() - MESSAGE_TOO_OLD_ELAPSED_MS,
  );
};

export const resumeWhatsAppFlow = async ({
  receivedMessages,
  referral,
  sessionId,
  workspaceId,
  credentialsId,
  phoneNumberId,
  contact,
  callFrom,
}: Props) => {
  console.log("📨 [DEBUG] resumeWhatsAppFlow called", {
    sessionId,
    messageCount: receivedMessages.length,
    messageTypes: receivedMessages.map((m) => m.type),
    workspaceId,
    credentialsId,
    contactName: contact?.name,
    callFrom,
  });

  if (receivedMessages.length === 0)
    throw new WhatsAppError("Received messages is empty");
  if (areMessagesTooOld(receivedMessages))
    throw new WhatsAppError("Message is too old", {
      timestamps: receivedMessages.map((message) => message.timestamp),
    });

  const isPreview = workspaceId === undefined || credentialsId === undefined;

  console.log("🔍 [DEBUG] Getting WhatsApp credentials...");
  const credentials = await getWhatsAppCredentials({
    credentialsId,
    workspaceId,
    isPreview,
  });
  console.log("🔍 [DEBUG] Credentials result:", { 
    found: !!credentials, 
    provider: credentials?.provider,
    phoneNumberId: (credentials as any)?.phoneNumberId 
  });
  
  if (!credentials) throw new WhatsAppError("Could not find credentials");

  if (
    phoneNumberId &&
    credentials.provider === "meta" &&
    credentials.phoneNumberId !== phoneNumberId
  )
    throw new WhatsAppError("Credentials point to another phone ID", {
      credentialsPhoneNumberId: credentials.phoneNumberId,
      receivedPhoneNumberId: phoneNumberId,
    });

  console.log("🔍 [DEBUG] Fetching session with ID:", sessionId);
  const session = await getSession(sessionId);
  console.log("🔍 [DEBUG] Session retrieved successfully");

  if (session && !session.state) {
    console.log("❌ [DEBUG] Session exists but has no state - throwing error");
    throw new WhatsAppError("Session is empty. Most likely in reply state.");
  }

  const aggregationResponse =
    await aggregateParallelMediaMessagesIfRedisEnabled({
      receivedMessages,
      sessionId,
    });

  if (aggregationResponse.status === "found newer message")
    throw new WhatsAppError("Found newer message, skipping this one");

  const isSessionExpired =
    isDefined(session?.state) &&
    isDefined(session.state.expiryTimeout) &&
    session?.updatedAt.getTime() + session.state.expiryTimeout < Date.now();

  if (!isSessionExpired && session?.isReplying && callFrom !== "webhook")
    throw new WhatsAppError("Is in reply state");
  else if (aggregationResponse.status === "treat as unique message") {
    console.log(
      "🔄 [DEBUG] Creating placeholder session (treat as unique message) - sessionId:",
      sessionId,
    );
    await upsertSession(sessionId, {
      isReplying: true,
    });
    console.log(
      "✅ [DEBUG] Placeholder session created with isReplying=true, state=null",
    );
  }

  // Check if enhanced analytics is enabled
  const isEnhancedAnalyticsEnabled =
    env.ENABLE_ENHANCED_CAMPAIGN_ANALYTICS !== false;

  let forcedTypebotId: string | undefined;

  if (receivedMessages.length > 0 && contact && isEnhancedAnalyticsEnabled) {
    let latestCampaignRecipient;
    
    // Priority 1: Check if this is a reply to a specific Campaign Message (Context match)
    // This is ROBUST because it links the reply directly to the campaign via Message ID.
    const context = receivedMessages[0].context;
    if (context?.id) {
       console.log(`🔍 [DEBUG] distinct context found: ${context.id}, checking for campaign match.`);
       latestCampaignRecipient = await prisma.campaignRecipient.findFirst({
        where: {
          messageId: context.id,
        },
        include: { campaign: true },
      });
    }

    // Priority 2: Fallback to Timestamp heuristic (if no context match)
    if (!latestCampaignRecipient) {
       latestCampaignRecipient = await prisma.campaignRecipient.findFirst({
        where: {
          phoneNumber: contact.phoneNumber,
          createdAt: { gt: session?.updatedAt ?? new Date(0) },
        },
        orderBy: { createdAt: "desc" },
        include: { campaign: true },
      });
    }

    if (latestCampaignRecipient) {
      // Check if we are already in this bot session to avoid a "Restart Loop" (Duplicate First Message Fix)
      const currentBotId = session?.state?.typebotsQueue[0]?.typebot?.id;
      const isAlreadyInSession = currentBotId === latestCampaignRecipient.campaign.typebotId;
      const isStarted = latestCampaignRecipient.status === RecipientStatus.STARTED;

      if (isAlreadyInSession && isStarted) {
         console.log("ℹ️ [DEBUG] Already in campaign session. Skipping Force Switch/Restart.");
         forcedTypebotId = undefined; // Proceed with normal flow resume
      } else {
          console.log(
            "🔄 [DEBUG] Found newer campaign. Switching session/Flushing old flow.",
            {
              oldTypebotId: session?.state?.typebotsQueue[0]?.typebot?.id,
              newTypebotId: latestCampaignRecipient.campaign.typebotId,
              campaignId: latestCampaignRecipient.campaign.id,
              reason: "New Campaign Detected",
            },
          );
          forcedTypebotId = latestCampaignRecipient.campaign.typebotId;
          
          // Update the NEW campaign status
          if (
            (
              [
                RecipientStatus.SENT,
                RecipientStatus.DELIVERED,
                RecipientStatus.OPENED,
                RecipientStatus.QUEUED,
                RecipientStatus.PENDING,
              ] as RecipientStatus[]
            ).includes(latestCampaignRecipient.status)
          ) {
            await prisma.campaignRecipient.update({
              where: { id: latestCampaignRecipient.id },
              data: {
                status: RecipientStatus.STARTED,
                startedAt: new Date(),
              },
            });
            console.log(
              `✅ [Campaign Analytics] Recipient ${latestCampaignRecipient.id} (${latestCampaignRecipient.phoneNumber}) status updated to STARTED`,
            );
          }
      }
    }
  }

  // If no campaign switch, Check for Start Condition Override (Individual Flow Switching)
  // DISABLED for now as per user request (Feature Flag: INDIVIDUAL_BOT_SWITCHING)
  /*
  if (!forcedTypebotId && receivedMessages[0].type === "text") {
    const message = receivedMessages[0];
    // Find bots with start conditions that match the message
    const publicTypebots = await prisma.publicTypebot.findMany({
      where: {
        typebot: { workspaceId },
        settings: {
          path: ["whatsApp", "isEnabled"],
          equals: true,
        },
      },
      select: {
        settings: true,
        typebot: {
          select: {
            publicId: true,
            id: true,
          },
        },
      },
    });

    const matchingBot = publicTypebots.find(
      (bot) =>
        (bot.settings.whatsApp?.startCondition?.comparisons.length ?? 0) > 0 &&
        messageMatchStartCondition(
          {
            type: "text",
            text: message.text?.body ?? "",
          },
          bot.settings.whatsApp?.startCondition,
        ),
    );

    if (matchingBot) {
      console.log(
        "🔄 [DEBUG] Found Start Keyword Match. Switching session/Flushing old flow.",
        {
          oldTypebotId: session?.state?.typebotsQueue[0]?.typebot?.id,
          newTypebotId: matchingBot.typebot.id,
          trigger: message.text?.body,
        },
      );
      forcedTypebotId = matchingBot.typebot.id;
    }
  }
  */

  const currentTypebot = session?.state?.typebotsQueue[0].typebot;
  const { block } =
    (currentTypebot && session?.state?.currentBlockId
      ? getBlockById(session.state.currentBlockId, currentTypebot.groups)
      : undefined) ?? {};
  
  // If forcedTypebotId is set, we use that for message conversion context if possible? 
  // Actually convertWhatsAppMessageToTypebotMessage uses currentTypebot?.id for media paths.
  // If we are switching, "currentTypebot" is technically the old one, but we are about to discard it.
  // Ideally we should peek the new bot, but for now we follow standard flow.
  
  console.log("🔍 [DEBUG] Converting WhatsApp messages to Typebot messages...");
  const reply = await convertWhatsAppMessageToTypebotMessage({
    messages: aggregationResponse.incomingMessages,
    workspaceId,
    credentials,
    typebotId: currentTypebot?.id, // Note: This might be old ID, but media processing usually doesn't care unless strict.
    resultId: session?.state?.typebotsQueue[0].resultId,
    block,
  });
  console.log("🔍 [DEBUG] Message conversion COMPLETE. Reply:", !!reply);

  const sessionStore = getSessionStore(sessionId);
  console.log("🔍 [DEBUG] Resuming flow and sending WhatsApp messages...");
  const {
    input,
    logs,
    visitedEdges,
    setVariableHistory,
    newSessionState,
    isWaitingForWebhook,
  } = await resumeFlowAndSendWhatsAppMessages({
    to: receivedMessages[0].from,
    credentials,
    isSessionExpired,
    reply,
    state: forcedTypebotId ? undefined : session?.state, // If forced, pass undefined state to force new session
    sessionStore,
    contact,
    workspaceId,
    credentialsId,
    referral,
    typebotId: forcedTypebotId, // Pass the new ID to start/resume flow
  });
  deleteSessionStore(sessionId);

  console.log("💾 [DEBUG] Saving state to database - sessionId:", sessionId, {
    hasInput: !!input,
    isWaitingForWebhook,
    currentBlockId: newSessionState.currentBlockId,
    typebotId: newSessionState.typebotsQueue?.[0]?.typebot?.id,
  });

  await saveStateToDatabase({
    clientSideActions: [],
    input,
    logs,
    sessionId: {
      type: "existing",
      id: sessionId,
    },
    session: {
      state: {
        ...newSessionState,
        currentBlockId:
          !input && !isWaitingForWebhook
            ? undefined
            : newSessionState.currentBlockId,
      },
    },
    isWaitingForExternalEvent: isWaitingForWebhook,
    visitedEdges,
    setVariableHistory,
  });

  console.log("✅ [DEBUG] State saved to database successfully");
};

const convertWhatsAppMessageToTypebotMessage = async ({
  messages,
  workspaceId,
  credentials,
  typebotId,
  resultId,
  block,
}: {
  messages: WhatsAppIncomingMessage[];
  workspaceId?: string;
  credentials: WhatsAppCredentials["data"];
  typebotId?: string;
  resultId?: string;
  block?: Block;
}): Promise<Message | undefined> => {
  let text = "";
  const append = (s: string) => (text = text !== "" ? `${text}\n\n${s}` : s);
  let replyId: string | undefined;
  const attachedFileUrls: string[] = [];
  for (const message of messages) {
    switch (message.type) {
      case "text": {
        append(message.text.body);
        break;
      }
      case "button": {
        append(message.button.text);
        break;
      }
      case "interactive": {
        switch (message.interactive.type) {
          case "button_reply": {
            replyId = message.interactive.button_reply.id;
            append(message.interactive.button_reply.title);
            break;
          }
          case "list_reply": {
            replyId = message.interactive.list_reply.id;
            append(message.interactive.list_reply.title);
            break;
          }
        }
        break;
      }
      case "document":
      case "audio":
      case "video":
      case "sticker":
      case "image": {
        let mediaId: string | undefined;
        let mimeType: string | undefined;
        if (message.type === "video") {
          mediaId = message.video.id;
          mimeType = message.video.mime_type;
        }
        if (message.type === "image") {
          mediaId = message.image.id;
          mimeType = message.image.mime_type;
        }
        if (message.type === "audio") {
          mediaId = message.audio.id;
          mimeType = message.audio.mime_type;
        }
        if (message.type === "document") {
          mediaId = message.document.id;
          mimeType = message.document.mime_type;
        }
        if (message.type === "sticker") {
          mediaId = message.sticker.id;
          mimeType = message.sticker.mime_type;
        }
        if (!mediaId) continue;

        const fileVisibility =
          block?.type === InputBlockType.TEXT &&
          block.options?.audioClip?.isEnabled &&
          message.type === "audio"
            ? block.options?.audioClip.visibility
            : block?.type === InputBlockType.FILE
              ? block.options?.visibility
              : block?.type === InputBlockType.TEXT
                ? block.options?.attachments?.visibility
                : undefined;
        let fileUrl;
        if (fileVisibility !== "Public") {
          const extension = mimeType
            ? extensionFromMimeType[mimeType]
            : undefined;
          fileUrl =
            env.NEXTAUTH_URL +
            `/api/typebots/${typebotId}/whatsapp/media/${
              workspaceId ? `` : "preview/"
            }${mediaId}${extension ? `.${extension}` : ""}`;
        } else {
          const { file, mimeType } = await downloadMedia({
            mediaId,
            credentials,
          });
          const extension = extensionFromMimeType[mimeType];
          const url = await uploadFileToBucket({
            file,
            key:
              resultId && workspaceId && typebotId
                ? `public/workspaces/${workspaceId}/typebots/${typebotId}/results/${resultId}/${mediaId}${extension ? `.${extension}` : ""}`
                : `tmp/whatsapp/media/${mediaId}${extension ? `.${extension}` : ""}`,
            mimeType,
          });
          fileUrl = url;
        }
        if (message.type === "audio")
          return {
            type: "audio",
            url: fileUrl,
          };
        if (block?.type === InputBlockType.FILE) {
          append(fileUrl);
        } else if (block?.type === InputBlockType.TEXT) {
          let caption: string | undefined;
          if (message.type === "document" && message.document.caption) {
            const looksLikeFilename = /^[\w,\s-]+\.[A-Za-z0-9]{1,10}$/;
            if (!looksLikeFilename.test(message.document.caption))
              caption = message.document.caption;
          } else if (message.type === "image" && message.image.caption)
            caption = message.image.caption;
          else if (message.type === "video" && message.video.caption)
            caption = message.video.caption;
          if (caption) text = text === "" ? caption : `${text}\n\n${caption}`;
          attachedFileUrls.push(fileUrl);
        }
        break;
      }
      case "location": {
        const location = `${message.location.latitude}, ${message.location.longitude}`;
        append(location);
        break;
      }
      case "webhook": {
        if (!message.webhook.data) return;
        text = message.webhook.data;
      }
    }
  }

  return {
    type: "text",
    text,
    attachedFileUrls,
    metadata: { replyId },
  };
};

const getWhatsAppCredentials = async ({
  credentialsId,
  workspaceId,
  isPreview,
}: {
  credentialsId?: string;
  workspaceId?: string;
  isPreview: boolean;
}): Promise<WhatsAppCredentials["data"] | undefined> => {
  console.log("🔍 [DEBUG credentials] Entering getWhatsAppCredentials", { isPreview, credentialsId, workspaceId });
  if (isPreview) {
    console.log("🔍 [DEBUG credentials] Preview mode detected. Checking env vars...");
    try {
      const token = env.META_SYSTEM_USER_TOKEN;
      const phoneId = env.WHATSAPP_PREVIEW_FROM_PHONE_NUMBER_ID;
      console.log("🔍 [DEBUG credentials] Env var access SUCCESS", { hasToken: !!token, hasPhoneId: !!phoneId });
      
      if (!token || !phoneId) {
        console.log("🔍 [DEBUG credentials] Missing preview env vars");
        return;
      }
      const creds = {
        provider: "meta" as const,
        systemUserAccessToken: token,
        phoneNumberId: phoneId,
      };
      console.log("🔍 [DEBUG credentials] Returning preview credentials");
      return creds;
    } catch (e) {
      console.error("❌ [DEBUG credentials] CRASH during preview env access!", e);
      throw e;
    }
  }

  if (!credentialsId || !workspaceId) {
    console.log("🔍 [DEBUG credentials] Missing credentialsId or workspaceId for non-preview");
    return;
  }

  try {
    console.log("🔍 [DEBUG credentials] Fetching production credentials...");
    const credentials = await getCredentials(credentialsId, workspaceId);
    console.log("🔍 [DEBUG credentials] Credentials fetched from DB:", !!credentials);
    if (!credentials) return;
    
    console.log("🔍 [DEBUG credentials] Decrypting credentials...", {
      ivLength: credentials.iv.length,
      dataLength: credentials.data.length,
      secretPrefix: env.ENCRYPTION_SECRET?.slice(0, 4) + "****",
    });
    const data = (await decrypt(
      credentials.data,
      credentials.iv,
    )) as WhatsAppCredentials["data"];
    console.log("🔍 [DEBUG credentials] Decryption SUCCESS", { 
      provider: data?.provider,
      phoneNumberId: (data as any)?.phoneNumberId 
    });
    return data;
  } catch (e) {
    console.error("❌ [DEBUG credentials] CRASH during production fetch/decrypt!", e);
    throw e;
  }
};

/**
 * Leverages Redis to aggregate incoming media messages.
 * For now, only used for media messages because they are by default sent as multiple sequential messages by WhatsApp.
 */
const aggregateParallelMediaMessagesIfRedisEnabled = async ({
  receivedMessages,
  sessionId,
}: {
  receivedMessages: WhatsAppIncomingMessage[];
  sessionId: string;
}): Promise<
  | {
      status: "treat as unique message";
      incomingMessages: WhatsAppIncomingMessage[];
    }
  | {
      status: "found newer message";
    }
  | {
      status: "ready to reply";
      incomingMessages: WhatsAppIncomingMessage[];
    }
> => {
  if (
    redis &&
    ["document", "video", "image"].includes(receivedMessages[0].type)
  ) {
    const redisKey = `wasession:${sessionId}`;
    try {
      const len = await redis.rpush(
        redisKey,
        JSON.stringify(receivedMessages[0]),
      );

      if (len === 1) {
        console.log(
          "🔄 [DEBUG] Creating placeholder session (first media in Redis) - sessionId:",
          sessionId,
          "len:",
          len,
        );
        await upsertSession(sessionId, {
          isReplying: true,
        });
        console.log(
          "✅ [DEBUG] Placeholder session created with isReplying=true, state=null",
        );
      }

      await new Promise((resolve) =>
        setTimeout(resolve, INCOMING_MEDIA_MESSAGE_DEBOUNCE),
      );

      const newMessagesResponse = await redis.lrange(redisKey, 0, -1);

      if (!newMessagesResponse || newMessagesResponse.length > len)
        return { status: "found newer message" };

      redis.del(redisKey).then();

      return {
        status: "ready to reply",
        incomingMessages: newMessagesResponse.map((msgStr) =>
          JSON.parse(msgStr),
        ),
      };
    } catch (err) {
      console.error("❌ [aggregateParallelMediaMessagesIfRedisEnabled] CRITICAL ERROR:", err);
      if (err instanceof Error) {
        console.error("Stack trace:", err.stack);
      }
      // Assuming sessionStore is available in this scope or can be passed.
      // If not, this line would cause a reference error.
      // For now, commenting out as sessionStore is not in the provided context for this function.
      // await sessionStore.cleanup();
      throw err;
    }
  }

  return {
    status: "treat as unique message",
    incomingMessages: receivedMessages,
  };
};

const resumeFlowAndSendWhatsAppMessages = async (props: {
  to: string;
  state: SessionState | null | undefined;
  sessionStore: SessionStore;
  reply: Message | undefined;
  contact?: NonNullable<SessionState["whatsApp"]>["contact"];
  referral?: WhatsAppMessageReferral;
  credentials: WhatsAppCredentials["data"];
  isSessionExpired: boolean | null;
  credentialsId?: string;
  workspaceId?: string;
  typebotId?: string;
}) => {
  const resumeResponse = await resumeFlow(props);

  const {
    input,
    logs,
    messages,
    clientSideActions,
    visitedEdges,
    setVariableHistory,
    newSessionState,
  } = resumeResponse;

  const isFirstChatChunk = (!props.state || props.isSessionExpired) ?? false;
  const result = await sendChatReplyToWhatsApp({
    to: props.to,
    messages,
    input,
    isFirstChatChunk,
    clientSideActions,
    credentials: props.credentials,
    state: newSessionState,
  });
  if (result?.type === "replyToSend")
    return resumeFlowAndSendWhatsAppMessages({
      ...props,
      state: newSessionState,
      reply: result.replyToSend
        ? {
            type: "text",
            text: result.replyToSend,
          }
        : undefined,
    });

  return {
    input,
    logs,
    visitedEdges,
    setVariableHistory,
    newSessionState,
    isWaitingForWebhook: result?.type === "shouldWaitForWebhook",
  };
};

const resumeFlow = ({
  state,
  isSessionExpired,
  reply,
  contact,
  referral,
  credentials,
  credentialsId,
  workspaceId,
  sessionStore,
  typebotId,
}: {
  reply: Message | undefined;
  contact?: NonNullable<SessionState["whatsApp"]>["contact"];
  referral?: WhatsAppMessageReferral;
  state: SessionState | null | undefined;
  credentials: WhatsAppCredentials["data"];
  isSessionExpired: boolean | null;
  credentialsId?: string;
  workspaceId?: string;
  sessionStore: SessionStore;
  typebotId?: string;
}) => {
  if (state && !isSessionExpired && !typebotId) {
    console.log(
      "🔄 [DEBUG] Continuing existing bot flow - currentBlockId:",
      state.currentBlockId,
    );
    return continueBotFlow(reply, {
      version: 2,
      sessionStore,
      state: contact
        ? {
            ...state,
            whatsApp: {
              contact,
              referral: referral
                ? {
                    sourceId: referral.source_id,
                    ctwaClickId: referral.ctwa_clid,
                  }
                : undefined,
            },
          }
        : state,
      textBubbleContentFormat: "richText",
    });
  }

  console.log("🆕 [DEBUG] Starting new WhatsApp session", {
    hasState: !!state,
    isSessionExpired,
    workspaceId,
    contactName: contact?.name,
    forcedTypebotId: typebotId,
  });

  if (!workspaceId || !contact)
    throw new WhatsAppError(
      "Can't start WhatsApp session without workspaceId or contact",
    );
  return startWhatsAppSession({
    incomingMessage: reply,
    workspaceId,
    credentials: { ...credentials, id: credentialsId as string },
    contact,
    referral,
    sessionStore,
    typebotId,
  });
};
