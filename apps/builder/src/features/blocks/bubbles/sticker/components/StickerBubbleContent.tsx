import type { StickerBubbleBlock } from "@typebot.io/blocks-bubbles/sticker/schema";

type Props = {
  block: StickerBubbleBlock;
};

export const StickerBubbleContent = ({ block }: Props) => {
  const { url } = block.content ?? {};

  if (!url) {
    return <div className="text-gray-500 italic">Configure sticker...</div>;
  }

  return (
    <div className="flex items-center gap-2 max-w-full">
      <span className="text-2xl flex-shrink-0">🎨</span>
      <div className="text-sm text-gray-600 truncate overflow-hidden">{url}</div>
    </div>
  );
};
