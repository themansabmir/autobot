import { blockBaseSchema } from "@typebot.io/blocks-base/schemas";
import { z } from "@typebot.io/zod";
import { BubbleBlockType } from "../constants";

export const documentBubbleContentSchema = z.object({
  url: z.string().optional(),
  filename: z.string().optional(),
  caption: z.string().optional(),
});

export const documentBubbleBlockSchema = blockBaseSchema
  .merge(
    z.object({
      type: z.enum([BubbleBlockType.DOCUMENT]),
      content: documentBubbleContentSchema.optional(),
    }),
  )
  .openapi({
    title: "Document",
    ref: `documentBlock`,
  });

export type DocumentBubbleBlock = z.infer<typeof documentBubbleBlockSchema>;
