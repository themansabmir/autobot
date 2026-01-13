import {
  blockBaseSchema,
  itemBaseSchemas,
  optionBaseSchema,
} from "@typebot.io/blocks-base/schemas";
import { z } from "@typebot.io/zod";
import { InputBlockType } from "../constants";

export const whatsAppListOptionsSchema = optionBaseSchema.merge(
  z.object({
    listHeader: z.string().optional(),
    buttonLabel: z.string().optional(), // The text on the button that opens the list
    listFooter: z.string().optional(),
    variableId: z.string().optional(),
  }),
);

export const whatsAppListItemSchema = itemBaseSchemas.v6.extend({
  content: z.string().optional(),
  description: z.string().optional(),
  sectionTitle: z.string().optional(),
});

export const whatsAppListBlockSchema = blockBaseSchema.merge(
  z.object({
    type: z.enum([InputBlockType.WHATSAPP_LIST]),
    items: z.array(whatsAppListItemSchema),
    options: whatsAppListOptionsSchema.optional(),
  }),
);

export type WhatsAppListItem = z.infer<typeof whatsAppListItemSchema>;
export type WhatsAppListBlock = z.infer<typeof whatsAppListBlockSchema>;
