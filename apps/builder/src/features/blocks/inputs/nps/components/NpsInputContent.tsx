import { npsInputConstants } from "@typebot.io/blocks-inputs/nps/constants";
import type { NpsInputBlock } from "@typebot.io/blocks-inputs/nps/schema";
import { WithVariableContent } from "@/features/graph/components/nodes/block/WithVariableContent";

type Props = {
  variableId?: string;
  block: NpsInputBlock;
};

export const NpsInputContent = ({ variableId, block }: Props) => {
  return variableId ? (
    <WithVariableContent variableId={variableId} />
  ) : (
    <p className="pr-6 truncate">
      {block.options?.labels?.question ?? npsInputConstants.defaultQuestion}
    </p>
  );
};
