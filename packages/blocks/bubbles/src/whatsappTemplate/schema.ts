import { blockBaseSchema } from "@typebot.io/blocks-base/schemas";
import { z } from "@typebot.io/zod";
import { BubbleBlockType } from "../constants";

export const whatsAppTemplateBubbleContentSchema = z.object({
  credentialsId: z.string().optional(),
  templateName: z.string().optional(),
  languageCode: z.string().optional(),
  variableMappings: z.record(z.string()).optional(),
  parsedTemplate: z.any().optional(),
});

export const whatsAppTemplateBlockSchema = blockBaseSchema.merge(
  z.object({
    type: z.literal(BubbleBlockType.WHATSAPP_TEMPLATE),
    content: whatsAppTemplateBubbleContentSchema.optional(),
  }),
);

export type WhatsAppTemplateBlock = z.infer<typeof whatsAppTemplateBlockSchema>;
