import { DebouncedTextInputWithVariablesButton } from "@/components/inputs/DebouncedTextInput";
import { VariablesCombobox } from "@/components/inputs/VariablesCombobox";
import { useTranslate } from "@tolgee/react";
import { defaultAddressInputOptions } from "@typebot.io/blocks-inputs/address/constants";
import type { AddressInputBlock } from "@typebot.io/blocks-inputs/address/schema";
import { Field } from "@typebot.io/ui/components/Field";
import { Switch } from "@typebot.io/ui/components/Switch";
import type { Variable } from "@typebot.io/variables/schemas";

type Props = {
  options: AddressInputBlock["options"];
  onOptionsChange: (options: AddressInputBlock["options"]) => void;
};

export const AddressInputSettings = ({ options, onOptionsChange }: Props) => {
  const { t } = useTranslate();

  const updateLabel = (field: string, value: string) =>
    onOptionsChange({
      ...options,
      labels: { ...options?.labels, [field]: value },
    });

  const updateRequired = (field: string, value: boolean) =>
    onOptionsChange({
      ...options,
      required: { ...options?.required, [field]: value },
    });

  const updateVariableId = (variable?: Variable) =>
    onOptionsChange({ ...options, variableId: variable?.id });

  const fields = [
    { key: "street", label: "Street Address" },
    { key: "city", label: "City" },
    { key: "state", label: "State/Province" },
    { key: "country", label: "Country" },
    { key: "postalCode", label: "Postal Code" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Field.Root>
        <Field.Label>Body Text</Field.Label>
        <DebouncedTextInputWithVariablesButton
          defaultValue={options?.content ?? defaultAddressInputOptions.content}
          onValueChange={(value) => onOptionsChange({ ...options, content: value })}
        />
      </Field.Root>
      <Field.Root>
        <Field.Label>Country Code (ISO)</Field.Label>
        <DebouncedTextInputWithVariablesButton
          defaultValue={options?.countryCode ?? defaultAddressInputOptions.countryCode}
          onValueChange={(value) => onOptionsChange({ ...options, countryCode: value })}
        />
      </Field.Root>
      <Field.Container>
        <div className="font-semibold">Field Configuration</div>
        {fields.map((field) => (
          <div key={field.key} className="flex flex-col gap-2 p-3 border rounded">
            <Field.Root>
              <Field.Label>{field.label} Label</Field.Label>
              <DebouncedTextInputWithVariablesButton
                defaultValue={
                  (options?.labels as any)?.[field.key] ??
                  (defaultAddressInputOptions.labels as any)[field.key]
                }
                onValueChange={(value) => updateLabel(field.key, value)}
              />
            </Field.Root>
            <Field.Root className="flex-row items-center">
              <Switch
                checked={
                  (options?.required as any)?.[field.key] ??
                  (defaultAddressInputOptions.required as any)[field.key]
                }
                onCheckedChange={(value) => updateRequired(field.key, value)}
              />
              <Field.Label>Required</Field.Label>
            </Field.Root>
          </div>
        ))}
      </Field.Container>
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
