import { SetVariableLabel } from "@/components/SetVariableLabel";
import { useTypebot } from "@/features/editor/providers/TypebotProvider";
import type { TemplateInputBlock } from "@typebot.io/blocks-inputs/template/schema";

type Props = {
  options: TemplateInputBlock["options"];
};

export const TemplateNodeContent = ({ options }: Props) => {
  const { typebot } = useTypebot();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <p className="text-gray-9 text-sm truncate font-semibold">
          {options?.templateName
            ? `Template: ${options.templateName}`
            : "No template selected"}
        </p>
        {options?.languageCode && (
          <p className="text-gray-500 text-xs truncate">
            Language: {options.languageCode}
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
