import { DebouncedTextInputWithVariablesButton } from "@/components/inputs/DebouncedTextInput";
import { VariablesCombobox } from "@/components/inputs/VariablesCombobox";
import { useTranslate } from "@tolgee/react";
import { defaultCtaUrlOptions } from "@typebot.io/blocks-inputs/ctaUrl/constants";
import type { CtaUrlInputBlock } from "@typebot.io/blocks-inputs/ctaUrl/schema";
import { Field } from "@typebot.io/ui/components/Field";
import type { Variable } from "@typebot.io/variables/schemas";

type Props = {
  options: CtaUrlInputBlock["options"];
  onOptionsChange: (options: CtaUrlInputBlock["options"]) => void;
};

export const CtaUrlSettings = ({ options, onOptionsChange }: Props) => {
  const { t } = useTranslate();

  const updateDisplayText = (displayText: string) =>
    onOptionsChange({ ...options, displayText });

  const updateUrl = (url: string) => onOptionsChange({ ...options, url });

  const updateVariableId = (variable?: Variable) =>
    onOptionsChange({ ...options, variableId: variable?.id });

  return (
    <div className="flex flex-col gap-4">
      <Field.Root>
        <Field.Label>Button Text</Field.Label>
        <DebouncedTextInputWithVariablesButton
          defaultValue={options?.displayText ?? defaultCtaUrlOptions.displayText}
          onValueChange={updateDisplayText}
        />
      </Field.Root>
      <Field.Root>
        <Field.Label>URL</Field.Label>
        <DebouncedTextInputWithVariablesButton
          defaultValue={options?.url ?? defaultCtaUrlOptions.url}
          onValueChange={updateUrl}
          placeholder="https://example.com"
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
