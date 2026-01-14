import { blockBaseSchema } from "@typebot.io/blocks-base/schemas";
import { z } from "@typebot.io/zod";
import { BubbleBlockType } from "../constants";

export const stickerBubbleContentSchema = z.object({
  url: z.string().optional(),
});

export const stickerBubbleBlockSchema = blockBaseSchema
  .merge(
    z.object({
      type: z.enum([BubbleBlockType.STICKER]),
      content: stickerBubbleContentSchema.optional(),
    }),
  )
  .openapi({
    title: "Sticker",
    ref: `stickerBlock`,
  });

export type StickerBubbleBlock = z.infer<typeof stickerBubbleBlockSchema>;
