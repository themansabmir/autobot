import { useTranslate } from "@tolgee/react";
import type { WhatsAppCarouselBlock } from "@typebot.io/blocks-inputs/whatsappCarousel/schema";

type Props = {
  block: WhatsAppCarouselBlock;
};

export const WhatsAppCarouselContent = ({ block }: Props) => {
  const { t } = useTranslate();
  
  const cardCount = block.items?.length ?? 0;
  const bodyText = block.options?.bodyText;

  return (
    <p className="text-gray-9 line-clamp-2">
      {bodyText || "Choose an option below:"}
      {cardCount > 0 && (
        <span className="font-semibold ml-2">
          ({cardCount} {cardCount === 1 ? "card" : "cards"})
        </span>
      )}
    </p>
  );
};
