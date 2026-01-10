import { SetVariableLabel } from "@/components/SetVariableLabel";
import { useTypebot } from "@/features/editor/providers/TypebotProvider";
import { defaultAddressInputOptions } from "@typebot.io/blocks-inputs/address/constants";
import type { AddressInputBlock } from "@typebot.io/blocks-inputs/address/schema";

type Props = {
  options: AddressInputBlock["options"];
};

export const AddressInputNodeContent = ({ options }: Props) => {
  const { typebot } = useTypebot();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <p className="text-gray-9 text-sm line-clamp-2 italic">
          "{options?.content ?? defaultAddressInputOptions.content}"
        </p>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <span className="font-semibold px-1 bg-gray-100 rounded">
            {options?.countryCode ?? defaultAddressInputOptions.countryCode}
          </span>
          <span>Address Message</span>
        </div>
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
