import { authenticatedProcedure } from "@/helpers/server/trpc";
import { ClientToastError } from "@/lib/ClientToastError";
import { TRPCError } from "@trpc/server";
import { decrypt } from "@typebot.io/credentials/decrypt";
import type { WhatsAppCredentials } from "@typebot.io/credentials/schemas";
import prisma from "@typebot.io/prisma";
import { getOrUploadMedia } from "@typebot.io/whatsapp/getOrUploadMedia";
import { z } from "@typebot.io/zod";

export const uploadStickerMedia = authenticatedProcedure
  .input(
    z.object({
      url: z.string().url(),
      workspaceId: z.string(),
      typebotId: z.string(),
    })
  )
  .mutation(async ({ input, ctx: { user } }) => {
    const { url, workspaceId, typebotId } = input;

    // Get typebot to verify access and get publicId
    const typebot = await prisma.typebot.findFirst({
      where: {
        id: typebotId,
        workspace: {
          members: {
            some: {
              userId: user.id,
            },
          },
        },
      },
      select: {
        publicId: true,
        workspaceId: true,
      },
    });

    if (!typebot) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Typebot not found",
      });
    }

    if (typebot.workspaceId !== workspaceId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Typebot does not belong to this workspace",
      });
    }

    if (!typebot.publicId) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Typebot must be published before uploading stickers",
      });
    }

    // Get WhatsApp credentials for the workspace
    const credentials = await prisma.credentials.findFirst({
      where: {
        workspaceId,
        type: "whatsApp",
      },
    });

    if (!credentials) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message:
          "WhatsApp credentials not found for this workspace. Please add WhatsApp integration first.",
      });
    }

    // Decrypt credentials
    const decryptedData = (await decrypt(
      credentials.data,
      credentials.iv
    )) as WhatsAppCredentials["data"];

    try {
      // Upload to WhatsApp using existing media upload utility
      const mediaId = await getOrUploadMedia({
        url,
        cache: {
          credentials: decryptedData,
          publicTypebotId: typebot.publicId, // Now safe - already checked for null
        },
      });

      if (!mediaId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload sticker to WhatsApp - no media ID returned",
        });
      }

      return { mediaId };
    } catch (error) {
      throw await ClientToastError.fromUnkownError(error);
    }
  });
