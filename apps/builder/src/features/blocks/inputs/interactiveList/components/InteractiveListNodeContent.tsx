import { SetVariableLabel } from "@/components/SetVariableLabel";
import { useTypebot } from "@/features/editor/providers/TypebotProvider";
import type { InteractiveListInputBlock } from "@typebot.io/blocks-inputs/interactiveList/schema";

type Props = {
  options: InteractiveListInputBlock["options"];
};

export const InteractiveListNodeContent = ({ options }: Props) => {
  const { typebot } = useTypebot();
  const totalRows =
    options?.sections?.reduce((acc, section) => acc + (section.rows?.length ?? 0), 0) ?? 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <p className="text-gray-9 text-sm line-clamp-2 italic">
          "{options?.body ?? "Select an option..."}"
        </p>
        <p className="text-gray-500 text-xs">
          {totalRows} list items ({options?.sections?.length ?? 0} sections)
        </p>
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
