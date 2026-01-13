import { useTranslate } from "@tolgee/react";
import type { WhatsAppListBlock } from "@typebot.io/blocks-inputs/whatsappList/schema";
import { Field } from "@typebot.io/ui/components/Field";
import type { Variable } from "@typebot.io/variables/schemas";
import { DebouncedTextInputWithVariablesButton } from "@/components/inputs/DebouncedTextInput";
import { VariablesCombobox } from "@/components/inputs/VariablesCombobox";

type Props = {
  options: WhatsAppListBlock["options"];
  onOptionsChange: (options: WhatsAppListBlock["options"]) => void;
};

export const WhatsAppListSettings = ({ options, onOptionsChange }: Props) => {
  const { t } = useTranslate();

  const updateListButtonText = (buttonLabel: string) =>
    onOptionsChange({ ...options, buttonLabel });
  const updateListHeader = (listHeader: string) =>
    onOptionsChange({ ...options, listHeader });
  const updateListFooter = (listFooter: string) =>
    onOptionsChange({ ...options, listFooter });
  const updateSaveVariable = (variable?: Variable) =>
    onOptionsChange({ ...options, variableId: variable?.id });

  return (
    <div className="flex flex-col gap-4">
      <Field.Root>
        <Field.Label>List Button Text</Field.Label>
        <DebouncedTextInputWithVariablesButton
          defaultValue={options?.buttonLabel ?? "Open List"}
          onValueChange={updateListButtonText}
          maxLength={20}
        />
      </Field.Root>
      <Field.Root>
        <Field.Label>Header (Optional)</Field.Label>
        <DebouncedTextInputWithVariablesButton
          defaultValue={options?.listHeader}
          onValueChange={updateListHeader}
          placeholder="List header..."
          maxLength={60}
        />
      </Field.Root>
      <Field.Root>
        <Field.Label>Footer (Optional)</Field.Label>
        <DebouncedTextInputWithVariablesButton
          defaultValue={options?.listFooter}
          onValueChange={updateListFooter}
          placeholder="List footer..."
          maxLength={60}
        />
      </Field.Root>
      <Field.Root>
        <Field.Label>
          {t("blocks.inputs.settings.saveAnswer.label")}
        </Field.Label>
        <VariablesCombobox
          initialVariableId={options?.variableId}
          onSelectVariable={updateSaveVariable}
        />
      </Field.Root>
    </div>
  );
};
