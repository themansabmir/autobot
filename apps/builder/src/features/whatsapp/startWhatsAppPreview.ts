import { authenticatedProcedure } from "@/helpers/server/trpc";
import { ClientToastError } from "@/lib/ClientToastError";
import { TRPCError } from "@trpc/server";
import { BubbleBlockType } from "@typebot.io/blocks-bubbles/constants";
import { saveStateToDatabase } from "@typebot.io/bot-engine/saveStateToDatabase";
import { startSession } from "@typebot.io/bot-engine/startSession";
import { startFromSchema } from "@typebot.io/chat-api/schemas";
import { restartSession } from "@typebot.io/chat-session/queries/restartSession";
import type { SessionState } from "@typebot.io/chat-session/schemas";
import { env } from "@typebot.io/env";
import { parseGroups } from "@typebot.io/groups/helpers/parseGroups";
import prisma from "@typebot.io/prisma";
import {
  deleteSessionStore,
  getSessionStore,
} from "@typebot.io/runtime-session-store";
import { isReadTypebotForbidden } from "@typebot.io/typebot/helpers/isReadTypebotForbidden";
import { getOrUploadMedia } from "@typebot.io/whatsapp/getOrUploadMedia";
import { sendChatReplyToWhatsApp } from "@typebot.io/whatsapp/sendChatReplyToWhatsApp";
import { sendWhatsAppMessage } from "@typebot.io/whatsapp/sendWhatsAppMessage";
import { z } from "@typebot.io/zod";

// Helper function to auto-upload stickers during preview
async function uploadStickersForPreview(typebot: any) {
  try {
    console.log("🔍 [Preview] Checking for stickers to upload...");
    
    if (!env.META_SYSTEM_USER_TOKEN) {
      console.log("⏭️  [Preview] No META_SYSTEM_USER_TOKEN, skipping upload");
      return;
    }

    const groups = parseGroups(typebot.groups, {
      typebotVersion: typebot.version,
    });

    let hasChanges = false;

    for (const group of groups) {
      for (const block of group.blocks) {
        if (
          block.type === BubbleBlockType.STICKER &&
          block.content?.url &&
          !block.content?.mediaId
        ) {
          console.log(`🔄 [Preview] Auto-uploading sticker for block ${block.id}...`);
          try {
            const mediaId = await getOrUploadMedia({
              url: block.content.url,
              cache: {
                credentials: {
                  provider: "meta" as const,
                  systemUserAccessToken: env.META_SYSTEM_USER_TOKEN,
                  phoneNumberId: env.WHATSAPP_PREVIEW_FROM_PHONE_NUMBER_ID || "",
                },
                publicTypebotId: typebot.publicId || typebot.id,
              },
            }).catch(() => null);

            if (mediaId) {
              block.content.mediaId = mediaId;
              hasChanges = true;
              console.log(`✅ [Preview] Sticker uploaded! mediaId: ${mediaId}`);
            }
          } catch (error) {
            console.error(`❌ [Preview] Failed to upload sticker:`, error);
          }
        }
      }
    }

    if (hasChanges) {
      await prisma.typebot.update({
        where: { id: typebot.id },
        data: { groups },
      });
      console.log(`✅ [Preview] Updated typebot with sticker mediaIds`);
    }
  } catch (error) {
    console.error("[Preview] Error during sticker auto-upload:", error);
  }
}

export const startWhatsAppPreview = authenticatedProcedure
  .meta({
    openapi: {
      method: "POST",
      path: "/v1/typebots/{typebotId}/whatsapp/start-preview",
      summary: "Start preview",
      tags: ["WhatsApp"],
      protect: true,
    },
  })
  .input(
    z.object({
      to: z
        .string()
        .min(1)
        .transform((value) =>
          value.replace(/\s/g, "").replace(/\+/g, "").replace(/-/g, ""),
        ),
      typebotId: z.string(),
      startFrom: startFromSchema.optional(),
    }),
  )
  .output(
    z.object({
      message: z.string(),
    }),
  )
  .mutation(async ({ input: { to, typebotId, startFrom }, ctx: { user } }) => {
    if (
      !env.WHATSAPP_PREVIEW_FROM_PHONE_NUMBER_ID ||
      !env.META_SYSTEM_USER_TOKEN ||
      !env.WHATSAPP_PREVIEW_TEMPLATE_NAME
    )
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "Missing WHATSAPP_PREVIEW_FROM_PHONE_NUMBER_ID or META_SYSTEM_USER_TOKEN or WHATSAPP_PREVIEW_TEMPLATE_NAME env variables",
      });

    const existingTypebot = await prisma.typebot.findFirst({
      where: {
        id: typebotId,
      },
      select: {
        id: true,
        groups: true,
        version: true,
        publicId: true,
        workspace: {
          select: {
            isSuspended: true,
            isPastDue: true,
            members: {
              select: {
                userId: true,
              },
            },
          },
        },
        collaborators: {
          select: {
            userId: true,
          },
        },
      },
    });
    if (
      !existingTypebot?.id ||
      (await isReadTypebotForbidden(existingTypebot, user))
    )
      throw new TRPCError({ code: "NOT_FOUND", message: "Typebot not found" });

    // Auto-upload stickers during preview
    await uploadStickersForPreview(existingTypebot);

    const sessionId = `wa-preview-${to}`;

    const existingSession = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
      },
      select: {
        updatedAt: true,
        state: true,
      },
    });

    // For users that did not interact with the bot in the last 24 hours, we need to send a template message.
    const canSendDirectMessagesToUser =
      (existingSession?.updatedAt.getTime() ?? 0) >
      Date.now() - 24 * 60 * 60 * 1000;

    const sessionStore = getSessionStore(sessionId);
    const {
      newSessionState,
      messages,
      input,
      clientSideActions,
      logs,
      visitedEdges,
      setVariableHistory,
    } = await startSession({
      version: 2,
      sessionStore,
      startParams: {
        isOnlyRegistering: !canSendDirectMessagesToUser,
        type: "preview",
        typebotId,
        startFrom,
        userId: user.id,
        isStreamEnabled: false,
        textBubbleContentFormat: "richText",
      },
      initialSessionState: {
        whatsApp: (existingSession?.state as SessionState | undefined)
          ?.whatsApp,
      },
    });
    deleteSessionStore(sessionId);

    try {
      if (canSendDirectMessagesToUser) {
        await sendChatReplyToWhatsApp({
          to,
          messages,
          input,
          clientSideActions,
          isFirstChatChunk: true,
          credentials: {
            provider: "meta",
            phoneNumberId: env.WHATSAPP_PREVIEW_FROM_PHONE_NUMBER_ID,
            systemUserAccessToken: env.META_SYSTEM_USER_TOKEN,
          },
          state: newSessionState,
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
            state: newSessionState,
          },
          visitedEdges,
          setVariableHistory,
        });

        return {
          message: "Sent direct WA message",
        };
      } else {
        await restartSession({
          state: newSessionState,
          id: sessionId,
        });

        await sendWhatsAppMessage({
          to,
          message: {
            type: "template",
            template: {
              language: {
                code: env.WHATSAPP_PREVIEW_TEMPLATE_LANG,
              },
              name: env.WHATSAPP_PREVIEW_TEMPLATE_NAME,
            },
          },
          credentials: {
            provider: "meta",
            phoneNumberId: env.WHATSAPP_PREVIEW_FROM_PHONE_NUMBER_ID,
            systemUserAccessToken: env.META_SYSTEM_USER_TOKEN,
          },
        });
        return {
          message: "Sent WA template",
        };
      }
    } catch (error) {
      throw await ClientToastError.fromUnkownError(error);
    }
  });
