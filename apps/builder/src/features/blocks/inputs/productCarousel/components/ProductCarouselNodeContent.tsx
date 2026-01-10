import { SetVariableLabel } from "@/components/SetVariableLabel";
import { useTypebot } from "@/features/editor/providers/TypebotProvider";
import type { ProductCarouselBlock } from "@typebot.io/blocks-inputs/productCarousel/schema";

type Props = {
  options: ProductCarouselBlock["options"];
};

export const ProductCarouselNodeContent = ({ options }: Props) => {
  const { typebot } = useTypebot();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <p className="text-gray-9 text-sm line-clamp-2 italic">
          "{options?.bodyText}"
        </p>
        {options?.catalogId && (
          <p className="text-gray-500 text-xs truncate">
            Catalog: {options.catalogId}
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
