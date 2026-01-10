import { DebouncedTextInputWithVariablesButton } from "@/components/inputs/DebouncedTextInput";
import { VariablesCombobox } from "@/components/inputs/VariablesCombobox";
import { useTranslate } from "@tolgee/react";
import { defaultTemplateOptions } from "@typebot.io/blocks-inputs/template/constants";
import type { TemplateInputBlock } from "@typebot.io/blocks-inputs/template/schema";
import { Field } from "@typebot.io/ui/components/Field";
import { MoreInfoTooltip } from "@typebot.io/ui/components/MoreInfoTooltip";
import type { Variable } from "@typebot.io/variables/schemas";

type Props = {
  options: TemplateInputBlock["options"];
  onOptionsChange: (options: TemplateInputBlock["options"]) => void;
};

export const TemplateSettings = ({ options, onOptionsChange }: Props) => {
  const { t } = useTranslate();

  const updateTemplateName = (templateName: string) =>
    onOptionsChange({ ...options, templateName });

  const updateLanguageCode = (languageCode: string) =>
    onOptionsChange({ ...options, languageCode });

  const updateVariableId = (variable?: Variable) =>
    onOptionsChange({ ...options, variableId: variable?.id });

  return (
    <div className="flex flex-col gap-4">
      <Field.Root>
        <Field.Label>
          Template Name
          <MoreInfoTooltip>
            The name of the pre-approved WhatsApp template. Templates must be
            created and approved in WhatsApp Business Manager before use.
          </MoreInfoTooltip>
        </Field.Label>
        <DebouncedTextInputWithVariablesButton
          defaultValue={options?.templateName ?? defaultTemplateOptions.templateName}
          onValueChange={updateTemplateName}
          placeholder="template_name"
        />
      </Field.Root>
      <Field.Root>
        <Field.Label>Language Code</Field.Label>
        <DebouncedTextInputWithVariablesButton
          defaultValue={
            options?.languageCode ?? defaultTemplateOptions.languageCode
          }
          onValueChange={updateLanguageCode}
          placeholder="en"
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
