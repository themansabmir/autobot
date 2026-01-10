import { DebouncedTextInputWithVariablesButton } from "@/components/inputs/DebouncedTextInput";
import { VariablesCombobox } from "@/components/inputs/VariablesCombobox";
import { useTranslate } from "@tolgee/react";
import { defaultLocationRequestOptions } from "@typebot.io/blocks-inputs/locationRequest/constants";
import type { LocationRequestInputBlock } from "@typebot.io/blocks-inputs/locationRequest/schema";
import { Field } from "@typebot.io/ui/components/Field";
import type { Variable } from "@typebot.io/variables/schemas";

type Props = {
  options: LocationRequestInputBlock["options"];
  onOptionsChange: (options: LocationRequestInputBlock["options"]) => void;
};

export const LocationRequestSettings = ({ options, onOptionsChange }: Props) => {
  const { t } = useTranslate();

  const updateRequestText = (requestText: string) =>
    onOptionsChange({ ...options, requestText });

  const updateVariableId = (variable?: Variable) =>
    onOptionsChange({ ...options, variableId: variable?.id });

  return (
    <div className="flex flex-col gap-4">
      <Field.Root>
        <Field.Label>Request Message</Field.Label>
        <DebouncedTextInputWithVariablesButton
          defaultValue={
            options?.requestText ?? defaultLocationRequestOptions.requestText
          }
          onValueChange={updateRequestText}
        />
      </Field.Root>
      <Field.Root>
        <Field.Label>
          {t("blocks.inputs.settings.saveAnswer.label")}
        </Field.Label>
        <VariablesCombobox
          initialVariableId={options?.variableId}
          onSelectVariable={updateVariableId}
        />
      </Field.Root>
    </div>
  );
};
