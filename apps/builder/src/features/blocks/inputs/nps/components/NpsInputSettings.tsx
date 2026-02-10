import { useTranslate } from "@tolgee/react";
import { npsInputConstants } from "@typebot.io/blocks-inputs/nps/constants";
import type { NpsInputBlock } from "@typebot.io/blocks-inputs/nps/schema";
import { Field } from "@typebot.io/ui/components/Field";
import type { Variable } from "@typebot.io/variables/schemas";
import { BasicNumberInput } from "@/components/inputs/BasicNumberInput";
import { BasicSelect } from "@/components/inputs/BasicSelect";
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

  const handleLengthChange = (length: string | undefined) =>
    onOptionsChange({
      ...options,
      length: length ? Number(length) : undefined,
    });

  const updateStartsAt = (startsAt: number | `{{${string}}}` | undefined) =>
    onOptionsChange({ ...options, startsAt });

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
      <div className="flex gap-4">
        <Field.Root>
          <Field.Label>Maximum score</Field.Label>
          <BasicSelect
            value={(
              options?.length ??
              (npsInputConstants.maxScore - npsInputConstants.minScore + 1)
            ).toString()}
            onChange={handleLengthChange}
            items={["3", "4", "5", "6", "7", "8", "9", "10", "11"]}
          />
        </Field.Root>
        <Field.Root>
          <Field.Label>Starts at</Field.Label>
          <BasicNumberInput
            defaultValue={options?.startsAt ?? npsInputConstants.minScore}
            onValueChange={updateStartsAt}
          />
        </Field.Root>
      </div>
      <Field.Root>
        <Field.Label>Start label</Field.Label>
        <DebouncedTextInputWithVariablesButton
          defaultValue={options?.labels?.lowLabel}
          onValueChange={handleLowLabelChange}
          placeholder={npsInputConstants.defaultLowLabel}
        />
      </Field.Root>
      <Field.Root>
        <Field.Label>End label</Field.Label>
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
