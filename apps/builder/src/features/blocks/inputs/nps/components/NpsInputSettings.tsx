import { useTranslate } from "@tolgee/react";
import { npsInputConstants } from "@typebot.io/blocks-inputs/nps/constants";
import type { NpsInputBlock } from "@typebot.io/blocks-inputs/nps/schema";
import { Field } from "@typebot.io/ui/components/Field";
import type { Variable } from "@typebot.io/variables/schemas";
import { BasicSelect } from "@/components/inputs/BasicSelect";
import { DebouncedTextInputWithVariablesButton } from "@/components/inputs/DebouncedTextInput";
import { VariablesCombobox } from "@/components/inputs/VariablesCombobox";

type Props = {
  options: NpsInputBlock["options"];
  onOptionsChange: (options: NpsInputBlock["options"]) => void;
};

const rangeValues = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

export const NpsInputSettings = ({ options, onOptionsChange }: Props) => {
  const { t } = useTranslate();

  const startsAt =
    typeof options?.startsAt === "number"
      ? options.startsAt
      : npsInputConstants.minScore;

  const length =
    options?.length ??
    npsInputConstants.maxScore - npsInputConstants.minScore + 1;
  const endsAt = startsAt + length - 1;

  const handleQuestionChange = (question: string) =>
    onOptionsChange({ ...options, labels: { ...options?.labels, question } });

  const handleButtonLabelChange = (button: string) =>
    onOptionsChange({ ...options, labels: { ...options?.labels, button } });

  const handleVariableChange = (variable?: Variable) =>
    onOptionsChange({ ...options, variableId: variable?.id });

  const handleStartsAtChange = (val: string | undefined) => {
    if (!val) return;
    const newStart = Number(val);
    const currentEnd = endsAt;
    // Ensure end is always >= start
    const newEnd = currentEnd < newStart ? newStart + 1 : currentEnd;
    onOptionsChange({
      ...options,
      startsAt: newStart,
      length: newEnd - newStart + 1,
    });
  };

  const handleEndsAtChange = (val: string | undefined) => {
    if (!val) return;
    const newEnd = Number(val);
    onOptionsChange({
      ...options,
      length: newEnd - startsAt + 1,
    });
  };

  // Filter "Ends at" options to only allow values > startsAt
  const endsAtValues = rangeValues.filter((v) => Number(v) > startsAt);

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
          <Field.Label>Starts at</Field.Label>
          <BasicSelect
            value={startsAt.toString()}
            onChange={handleStartsAtChange}
            items={rangeValues.filter((v) => Number(v) < 10)}
          />
        </Field.Root>
        <Field.Root>
          <Field.Label>Ends at</Field.Label>
          <BasicSelect
            value={endsAt.toString()}
            onChange={handleEndsAtChange}
            items={endsAtValues}
          />
        </Field.Root>
      </div>

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
