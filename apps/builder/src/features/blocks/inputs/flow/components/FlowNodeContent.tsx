import { SetVariableLabel } from "@/components/SetVariableLabel";
import { useTypebot } from "@/features/editor/providers/TypebotProvider";
import { defaultFlowOptions } from "@typebot.io/blocks-inputs/flow/constants";
import type { FlowInputBlock } from "@typebot.io/blocks-inputs/flow/schema";

type Props = {
  options: FlowInputBlock["options"];
};

export const FlowNodeContent = ({ options }: Props) => {
  const { typebot } = useTypebot();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <p className="text-gray-9 text-sm truncate font-semibold">
          {options?.flowCta ?? defaultFlowOptions.flowCta}
        </p>
        {options?.flowId && (
          <p className="text-gray-500 text-xs truncate">
            ID: {options.flowId}
          </p>
        )}
      </div>
      {options?.variableId && (
        <SetVariableLabel
          variables={typebot?.variables}
          variableId={options.variableId}
        />
      )}
    </div>
  );
};
