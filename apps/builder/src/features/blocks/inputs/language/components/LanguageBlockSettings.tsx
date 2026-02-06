import { useTranslate } from "@tolgee/react";
import type { LanguageBlock } from "@typebot.io/blocks-inputs/language/schema";
import type { Settings } from "@typebot.io/settings/schemas";
import { Field } from "@typebot.io/ui/components/Field";
import { DebouncedTextInput } from "@/components/inputs/DebouncedTextInput";
import { useTypebot } from "@/features/editor/providers/TypebotProvider";
import { LocalizationForm } from "@/features/settings/components/LocalizationForm";

type Props = {
  options: LanguageBlock["options"];
  onOptionsChange: (options: LanguageBlock["options"]) => void;
};

export const LanguageBlockSettings = ({ options, onOptionsChange }: Props) => {
  const { typebot, updateTypebot } = useTypebot();
  const { t } = useTranslate();

  const handleLocalizationChange = (localization: Settings["localization"]) =>
    typebot &&
    updateTypebot({
      updates: { settings: { ...typebot.settings, localization } },
    });

  const handlePlaceholderChange = (placeholder: string) =>
    onOptionsChange({
      ...options,
      labels: { ...options?.labels, placeholder },
    });

  if (!typebot) return null;

  return (
    <div className="flex flex-col gap-6 p-4">
      <Field.Root>
        <Field.Label>Prompt</Field.Label>
        <DebouncedTextInput
          placeholder="e.g. Choose your language"
          defaultValue={options?.labels?.placeholder}
          onValueChange={handlePlaceholderChange}
        />
      </Field.Root>

      <hr className="border-gray-6" />

      <LocalizationForm
        localization={typebot.settings.localization}
        onLocalizationChange={handleLocalizationChange}
      />
    </div>
  );
};
