import type { StickerBubbleBlock } from "./schema";

export const defaultStickerBubbleContent = {
  url: undefined,
} as const satisfies StickerBubbleBlock["content"];
