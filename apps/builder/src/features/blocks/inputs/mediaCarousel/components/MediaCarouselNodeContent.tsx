import { SetVariableLabel } from "@/components/SetVariableLabel";
import { useTypebot } from "@/features/editor/providers/TypebotProvider";
import type { MediaCarouselBlock } from "@typebot.io/blocks-inputs/mediaCarousel/schema";

type Props = {
  options: MediaCarouselBlock["options"];
};

export const MediaCarouselNodeContent = ({ options }: Props) => {
  const { typebot } = useTypebot();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <p className="text-gray-9 text-sm line-clamp-2 italic">
          "{options?.bodyText}"
        </p>
        <p className="text-gray-500 text-xs">
          {options?.cards?.length ?? 0} media cards
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
