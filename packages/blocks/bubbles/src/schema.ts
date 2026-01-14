import { z } from "@typebot.io/zod";
import { audioBubbleBlockSchema } from "./audio/schema";
import { embedBubbleBlockSchema } from "./embed/schema";
import { imageBubbleBlockSchema } from "./image/schema";
import { stickerBubbleBlockSchema } from "./sticker/schema";
import { textBubbleBlockSchema } from "./text/schema";
import { videoBubbleBlockSchema } from "./video/schema";

export const bubbleBlockSchema = z.discriminatedUnion("type", [
  textBubbleBlockSchema,
  imageBubbleBlockSchema,
  videoBubbleBlockSchema,
  embedBubbleBlockSchema,
  audioBubbleBlockSchema,
  stickerBubbleBlockSchema,
]);
export type BubbleBlock = z.infer<typeof bubbleBlockSchema>;

export type BubbleBlockContent = BubbleBlock["content"];
