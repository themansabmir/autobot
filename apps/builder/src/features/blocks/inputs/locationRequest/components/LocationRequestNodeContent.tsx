import { SetVariableLabel } from "@/components/SetVariableLabel";
import { useTypebot } from "@/features/editor/providers/TypebotProvider";
import { defaultLocationRequestOptions } from "@typebot.io/blocks-inputs/locationRequest/constants";
import type { LocationRequestInputBlock } from "@typebot.io/blocks-inputs/locationRequest/schema";

type Props = {
  options: LocationRequestInputBlock["options"];
};

export const LocationRequestNodeContent = ({ options }: Props) => {
  const { typebot } = useTypebot();
  return (
    <div className="flex flex-col gap-2">
      <p className="text-gray-9 text-sm line-clamp-2 italic">
        "{options?.requestText ?? defaultLocationRequestOptions.requestText}"
      </p>
      {options?.variableId && (
        <SetVariableLabel
          variables={typebot?.variables}
          variableId={options.variableId}
        />
      )}
    </div>
  );
};
