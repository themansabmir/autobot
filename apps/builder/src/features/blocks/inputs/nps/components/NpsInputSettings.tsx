import { useTranslate } from "@tolgee/react";
import { npsInputConstants } from "@typebot.io/blocks-inputs/nps/constants";
import type { NpsInputBlock } from "@typebot.io/blocks-inputs/nps/schema";
import { Field } from "@typebot.io/ui/components/Field";
import type { Variable } from "@typebot.io/variables/schemas";
import { DebouncedTextInputWithVariablesButton } from "@/components/inputs/DebouncedTextInput";
import { VariablesCombobox } from "@/components/inputs/VariablesCombobox";

type Props = {
  options: NpsInputBlock["options"];
  onOptionsChange: (options: NpsInputBlock["options"]) => void;
};

export const NpsInputSettings = ({ options, onOptionsChange }: Props) => {
  const { t } = useTranslate();

  const handleQuestionChange = (question: string) =>
    onOptionsChange({ ...options, labels: { ...options?.labels, question } });

  const handleLowLabelChange = (lowLabel: string) =>
    onOptionsChange({ ...options, labels: { ...options?.labels, lowLabel } });

  const handleHighLabelChange = (highLabel: string) =>
    onOptionsChange({ ...options, labels: { ...options?.labels, highLabel } });

  const handleButtonLabelChange = (button: string) =>
    onOptionsChange({ ...options, labels: { ...options?.labels, button } });

  const handleVariableChange = (variable?: Variable) =>
    onOptionsChange({ ...options, variableId: variable?.id });

  return (
    <div className="flex flex-col gap-4">
      <Field.Root>
        <Field.Label>Question</Field.Label>
        <DebouncedTextInputWithVariablesButton
          defaultValue={options?.labels?.question}
          onValueChange={handleQuestionChange}
          placeholder={npsInputConstants.defaultQuestion}
        />
      </Field.Root>
      <Field.Root>
        <Field.Label>Low score label (0)</Field.Label>
        <DebouncedTextInputWithVariablesButton
          defaultValue={options?.labels?.lowLabel}
          onValueChange={handleLowLabelChange}
          placeholder={npsInputConstants.defaultLowLabel}
        />
      </Field.Root>
      <Field.Root>
        <Field.Label>High score label (10)</Field.Label>
        <DebouncedTextInputWithVariablesButton
          defaultValue={options?.labels?.highLabel}
          onValueChange={handleHighLabelChange}
          placeholder={npsInputConstants.defaultHighLabel}
        />
      </Field.Root>
      <Field.Root>
        <Field.Label>{t("blocks.inputs.settings.button.label")}</Field.Label>
        <DebouncedTextInputWithVariablesButton
          defaultValue={
            options?.labels?.button ?? npsInputConstants.defaultButtonLabel
          }
          onValueChange={handleButtonLabelChange}
        />
      </Field.Root>
      <Field.Root>
        <Field.Label>
          {t("blocks.inputs.settings.saveAnswer.label")}
        </Field.Label>
        <VariablesCombobox
          initialVariableId={options?.variableId}
          onSelectVariable={handleVariableChange}
        />
      </Field.Root>
    </div>
  );
};
