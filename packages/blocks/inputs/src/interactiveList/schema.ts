import {
    blockBaseSchema,
    optionBaseSchema,
} from "@typebot.io/blocks-base/schemas";
import { z } from "@typebot.io/zod";
import { InputBlockType } from "../constants";

export const interactiveListRowSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
});

export const interactiveListSectionSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  rows: z.array(interactiveListRowSchema).min(1),
});

export const interactiveListOptionsSchema = optionBaseSchema.merge(
  z.object({
    header: z.string().optional(),
    body: z.string().optional(),
    footer: z.string().optional(),
    buttonText: z.string().optional(),
    sections: z.array(interactiveListSectionSchema).min(1),
  })
);

export const interactiveListInputSchema = blockBaseSchema
  .merge(
    z.object({
      type: z.enum([InputBlockType.INTERACTIVE_LIST]),
      options: interactiveListOptionsSchema.optional(),
    })
  )
  .openapi({
    title: "Interactive List",
    ref: "interactiveListInput",
  });

export type InteractiveListInputBlock = z.infer<
  typeof interactiveListInputSchema
>;
