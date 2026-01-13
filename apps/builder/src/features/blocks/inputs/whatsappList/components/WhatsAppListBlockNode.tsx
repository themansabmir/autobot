import { useTranslate } from "@tolgee/react";
import type { BlockIndices } from "@typebot.io/blocks-core/schemas/schema";
import type { WhatsAppListBlock } from "@typebot.io/blocks-inputs/whatsappList/schema";
import { SetVariableLabel } from "@/components/SetVariableLabel";
import { useTypebot } from "@/features/editor/providers/TypebotProvider";
import { ItemNodesList } from "@/features/graph/components/nodes/item/ItemNodesList";

type Props = {
  block: WhatsAppListBlock;
  indices: BlockIndices;
};

export const WhatsAppListBlockNode = ({ block, indices }: Props) => {
  const { typebot } = useTypebot();
  const { t } = useTranslate();

  return (
    <div className="flex flex-col gap-2 w-[90%]">
      <ItemNodesList block={block} indices={indices} />
      {block.options?.variableId ? (
        <SetVariableLabel
          variableId={block.options.variableId}
          variables={typebot?.variables}
        />
      ) : null}
    </div>
  );
};
