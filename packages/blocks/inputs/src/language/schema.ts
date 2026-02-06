import {
  blockBaseSchema,
  itemBaseSchemas,
  optionBaseSchema,
} from "@typebot.io/blocks-base/schemas";
import { z } from "@typebot.io/zod";
import { InputBlockType } from "../constants";

export const languageItemSchema = itemBaseSchemas.v6.extend({
  name: z.string(),
  code: z.string(),
});

export const languageBlockOptionsSchema = optionBaseSchema.extend({
  labels: z
    .object({
      placeholder: z.string().optional(),
    })
    .optional(),
});

export const languageBlockSchema = blockBaseSchema.merge(
  z.object({
    type: z.enum([InputBlockType.LANGUAGE]),
    items: z.array(languageItemSchema).optional(),
    options: languageBlockOptionsSchema.optional(),
  }),
);

export type LanguageItem = z.infer<typeof languageItemSchema>;
export type LanguageBlock = z.infer<typeof languageBlockSchema>;
