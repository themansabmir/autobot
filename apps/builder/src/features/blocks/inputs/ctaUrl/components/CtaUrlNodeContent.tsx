import { SetVariableLabel } from "@/components/SetVariableLabel";
import { useTypebot } from "@/features/editor/providers/TypebotProvider";
import { defaultCtaUrlOptions } from "@typebot.io/blocks-inputs/ctaUrl/constants";
import type { CtaUrlInputBlock } from "@typebot.io/blocks-inputs/ctaUrl/schema";

type Props = {
  options: CtaUrlInputBlock["options"];
};

export const CtaUrlNodeContent = ({ options }: Props) => {
  const { typebot } = useTypebot();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <p className="text-gray-9 text-sm truncate font-semibold">
          {options?.displayText ?? defaultCtaUrlOptions.displayText}
        </p>
        {options?.url && (
          <p className="text-gray-500 text-xs truncate">
            {options.url}
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
