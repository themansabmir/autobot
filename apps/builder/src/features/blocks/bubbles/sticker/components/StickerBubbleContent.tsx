import { useTypebot } from "@/features/editor/providers/TypebotProvider";
import { VariableTag } from "@/features/graph/components/nodes/block/VariableTag";
import { useTranslate } from "@tolgee/react";
import type { StickerBubbleBlock } from "@typebot.io/blocks-bubbles/sticker/schema";
import { cx } from "@typebot.io/ui/lib/cva";
import { findUniqueVariable } from "@typebot.io/variables/findUniqueVariable";

type Props = {
  block: StickerBubbleBlock;
};

export const StickerBubbleContent = ({ block }: Props) => {
  const { typebot } = useTypebot();
  const { t } = useTranslate();
  const variable = typebot
    ? findUniqueVariable(typebot?.variables)(block.content?.url)
    : null;
  return !block.content?.url ? (
    <p color={"gray.500"}>{t("clickToEdit")}</p>
  ) : variable ? (
    <p>
      Display <VariableTag variableName={variable.name} />
    </p>
  ) : (
    <div className="w-full flex justify-center">
      <img
        className={cx(
          "object-contain rounded-md pointer-events-none max-w-[128px] max-h-[128px]"
        )}
        src={block.content?.url}
        alt="Sticker"
      />
    </div>
  );
};
