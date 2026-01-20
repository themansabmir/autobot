import { TRPCError } from "@trpc/server";
import { BubbleBlockType } from "@typebot.io/blocks-bubbles/constants";
import { InputBlockType } from "@typebot.io/blocks-inputs/constants";
import { decrypt } from "@typebot.io/credentials/decrypt";
import type { WhatsAppCredentials } from "@typebot.io/credentials/schemas";
import { env } from "@typebot.io/env";
import { parseGroups } from "@typebot.io/groups/helpers/parseGroups";
import prisma from "@typebot.io/prisma";
import { Plan } from "@typebot.io/prisma/enum";
import { computeRiskLevel } from "@typebot.io/radar/computeRiskLevel";
import { detectTrademarkInfrigement } from "@typebot.io/radar/detectTrademarkInfrigement";
import {
  deleteSessionStore,
  getSessionStore,
} from "@typebot.io/runtime-session-store";
import { isTypebotVersionAtLeastV6 } from "@typebot.io/schemas/helpers/isTypebotVersionAtLeastV6";
import { settingsSchema } from "@typebot.io/settings/schemas";
import type { TelemetryEvent } from "@typebot.io/telemetry/schemas";
import { sendMessage } from "@typebot.io/telemetry/sendMessage";
import { trackEvents } from "@typebot.io/telemetry/trackEvents";
import { themeSchema } from "@typebot.io/theme/schemas";
import { edgeSchema } from "@typebot.io/typebot/schemas/edge";
import { publicTypebotSchemaV6 } from "@typebot.io/typebot/schemas/publicTypebot";
import { typebotV6Schema } from "@typebot.io/typebot/schemas/typebot";
import { variableSchema } from "@typebot.io/variables/schemas";
import { getOrUploadMedia } from "@typebot.io/whatsapp/getOrUploadMedia";
import { z } from "@typebot.io/zod";
import { parseTypebotPublishEvents } from "@/features/telemetry/helpers/parseTypebotPublishEvents";
import { authenticatedProcedure } from "@/helpers/server/trpc";
import { isWriteTypebotForbidden } from "../helpers/isWriteTypebotForbidden";

const warningSchema = z.object({
  type: z.enum(["trademarkInfringement"]),
  trademark: z.string(),
});
type Warning = z.infer<typeof warningSchema>;

// Helper function to auto-upload stickers during publish
async function uploadStickersIfNeeded(typebot: any) {
  console.log("🔍 Checking for stickers to upload...");
  try {
    // Get WhatsApp credentials for this workspace
    const credentials = await prisma.credentials.findFirst({
      where: {
        workspaceId: typebot.workspaceId,
        type: "whatsApp",
      },
    });

    console.log(`📋 WhatsApp credentials found: ${!!credentials}`);
    console.log(`📋 Typebot publicId: ${typebot.publicId}`);

    // If no WhatsApp credentials, skip upload
    if (!credentials || !typebot.publicId) {
      console.log("⏭️  Skipping sticker upload - no credentials or publicId");
      return;
    }

    // Decrypt credentials
    const decryptedData = (await decrypt(
      credentials.data,
      credentials.iv,
    )) as WhatsAppCredentials["data"];

    // Parse groups to find sticker blocks
    const groups = parseGroups(typebot.groups, {
      typebotVersion: typebot.version,
    });

    let hasChanges = false;

    // Process each group and block
    for (const group of groups) {
      for (const block of group.blocks) {
        if (
          block.type === BubbleBlockType.STICKER &&
          block.content?.url &&
          !block.content?.mediaId
        ) {
          console.log(
            `🔄 Auto-uploading sticker for block ${block.id} to WhatsApp...`,
          );
          try {
            // Upload to WhatsApp and save mediaId
            const mediaId = await getOrUploadMedia({
              url: block.content.url,
              cache: {
                credentials: decryptedData,
                publicTypebotId: typebot.publicId,
              },
            }).catch((_error) => {
              // If caching fails (e.g., FK constraint), try without cache
              console.log("⚠️  Cache failed, retrying without cache...");
              return null;
            });

            if (mediaId) {
              // Update block content with mediaId
              block.content.mediaId = mediaId;
              hasChanges = true;
              console.log(`✅ Sticker uploaded! mediaId: ${mediaId}`);
            }
          } catch (error) {
            console.error(
              `❌ Failed to upload sticker for block ${block.id}:`,
              error,
            );
            // Continue with other stickers even if one fails
          }
        }
      }
    }

    // If any stickers were uploaded, update the typebot
    if (hasChanges) {
      await prisma.typebot.update({
        where: { id: typebot.id },
        data: { groups },
      });
      console.log(`✅ Updated typebot with ${groups.length} sticker mediaIds`);
    }
  } catch (error) {
    // Log error but don't block publish
    console.error("Error during sticker auto-upload:", error);
  }
}
export const publishTypebot = authenticatedProcedure
  .meta({
    openapi: {
      method: "POST",
      path: "/v1/typebots/{typebotId}/publish",
      protect: true,
      summary: "Publish a typebot",
      tags: ["Typebot"],
    },
  })
  .input(
    z.object({
      typebotId: z
        .string()
        .describe(
          "[Where to find my bot's ID?](../how-to#how-to-find-my-typebotid)",
        ),
    }),
  )
  .output(
    z.object({
      message: z.literal("success"),
      warnings: z.array(warningSchema).optional(),
    }),
  )
  .mutation(async ({ input: { typebotId }, ctx: { user } }) => {
    const warnings: Warning[] = [];

    const existingTypebot = await prisma.typebot.findFirst({
      where: {
        id: typebotId,
      },
      include: {
        collaborators: true,
        publishedTypebot: true,
        workspace: {
          select: {
            plan: true,
            isVerified: true,
            isSuspended: true,
            isPastDue: true,
            members: {
              select: {
                userId: true,
                role: true,
              },
            },
          },
        },
      },
    });
    if (
      !existingTypebot?.id ||
      (await isWriteTypebotForbidden(existingTypebot, user))
    )
      throw new TRPCError({ code: "NOT_FOUND", message: "Typebot not found" });

    const hasFileUploadBlocks = parseGroups(existingTypebot.groups, {
      typebotVersion: existingTypebot.version,
    }).some((group) =>
      group.blocks.some((block) => block.type === InputBlockType.FILE),
    );

    if (hasFileUploadBlocks && existingTypebot.workspace.plan === Plan.FREE)
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "File upload blocks can't be published on the free plan",
      });

    const typebotWasVerified =
      existingTypebot.riskLevel === -1 || existingTypebot.workspace.isVerified;

    if (
      !typebotWasVerified &&
      existingTypebot.riskLevel &&
      existingTypebot.riskLevel > 80
    )
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "Radar detected a potential malicious typebot. This bot is being manually reviewed by Fraud Prevention team.",
      });

    const sessionStore = getSessionStore(typebotId);
    const riskLevel = typebotWasVerified
      ? 0
      : await computeRiskLevel(typebotV6Schema.parse(existingTypebot), {
          sessionStore,
          debug: env.NODE_ENV === "development",
        });
    deleteSessionStore(typebotId);

    if (riskLevel > 0 && riskLevel !== existingTypebot.riskLevel) {
      if (riskLevel !== 100 && riskLevel > 60)
        await sendMessage(
          `⚠️ Suspicious typebot to be reviewed: ${existingTypebot.name} (${env.NEXTAUTH_URL}/typebots/${existingTypebot.id}/edit) (workspace: ${existingTypebot.workspaceId})`,
        );

      await prisma.typebot.updateMany({
        where: {
          id: existingTypebot.id,
        },
        data: {
          riskLevel,
        },
      });
      if (riskLevel > 80) {
        if (existingTypebot.publishedTypebot)
          await prisma.publicTypebot.deleteMany({
            where: {
              id: existingTypebot.publishedTypebot.id,
            },
          });
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Radar detected a potential malicious typebot. This bot is being manually reviewed by Fraud Prevention team.",
        });
      }
    }

    if (!typebotWasVerified) {
      const newMetadata = existingTypebot.settings
        ? settingsSchema.parse(existingTypebot.settings).metadata
        : undefined;
      const publishedMetadata = existingTypebot.publishedTypebot
        ? settingsSchema.parse(existingTypebot.publishedTypebot.settings)
            .metadata
        : undefined;

      if (
        newMetadata?.title !== publishedMetadata?.title ||
        newMetadata?.description !== publishedMetadata?.description
      ) {
        const detectedTrademark = detectTrademarkInfrigement(newMetadata);
        if (detectedTrademark) {
          warnings.push({
            type: "trademarkInfringement",
            trademark: detectedTrademark,
          });
        }
      }
    }

    const publishEvents: TelemetryEvent[] = await parseTypebotPublishEvents({
      existingTypebot,
      userId: user.id,
      hasFileUploadBlocks,
    });

    // Auto-upload stickers to WhatsApp before publishing
    await uploadStickersIfNeeded(existingTypebot);

    if (existingTypebot.publishedTypebot)
      await prisma.publicTypebot.updateMany({
        where: {
          id: existingTypebot.publishedTypebot.id,
        },
        data: {
          version: existingTypebot.version,
          edges: z.array(edgeSchema).parse(existingTypebot.edges),
          groups: parseGroups(existingTypebot.groups, {
            typebotVersion: existingTypebot.version,
          }),
          events:
            (isTypebotVersionAtLeastV6(existingTypebot.version)
              ? publicTypebotSchemaV6.shape.events
              : z.null()
            ).parse(existingTypebot.events) ?? undefined,
          settings: settingsSchema.parse(existingTypebot.settings),
          variables: z.array(variableSchema).parse(existingTypebot.variables),
          theme: themeSchema.parse(existingTypebot.theme),
        },
      });
    else {
      await prisma.publicTypebot.createMany({
        data: {
          version: existingTypebot.version,
          typebotId: existingTypebot.id,
          edges: z.array(edgeSchema).parse(existingTypebot.edges),
          groups: parseGroups(existingTypebot.groups, {
            typebotVersion: existingTypebot.version,
          }),
          events:
            (isTypebotVersionAtLeastV6(existingTypebot.version)
              ? publicTypebotSchemaV6.shape.events
              : z.null()
            ).parse(existingTypebot.events) ?? undefined,
          settings: settingsSchema.parse(existingTypebot.settings),
          variables: z.array(variableSchema).parse(existingTypebot.variables),
          theme: themeSchema.parse(existingTypebot.theme),
        },
      });
      publishEvents.push({
        name: "Typebot published",
        workspaceId: existingTypebot.workspaceId,
        typebotId: existingTypebot.id,
        userId: user.id,
        data: {
          isFirstPublish: existingTypebot.publishedTypebot ? undefined : true,
        },
      });
    }

    await trackEvents(publishEvents);

    return {
      message: "success",
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  });
