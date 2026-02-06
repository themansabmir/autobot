import { useTranslate } from "@tolgee/react";
import type { Settings } from "@typebot.io/settings/schemas";
import { Button } from "@typebot.io/ui/components/Button";
import { Field } from "@typebot.io/ui/components/Field";
import { Switch } from "@typebot.io/ui/components/Switch";
import { PlusSignIcon } from "@typebot.io/ui/icons/PlusSignIcon";
import { TrashIcon } from "@typebot.io/ui/icons/TrashIcon";
import { DebouncedTextInput } from "@/components/inputs/DebouncedTextInput";

type Props = {
  localization: Settings["localization"] | undefined;
  onLocalizationChange: (localization: Settings["localization"]) => void;
};

export const LocalizationForm = ({
  localization,
  onLocalizationChange,
}: Props) => {
  const { t } = useTranslate();

  const toggleEnabled = (isEnabled: boolean) =>
    onLocalizationChange({ ...localization, isEnabled });

  const addLanguage = () =>
    onLocalizationChange({
      ...localization,
      languages: [...(localization?.languages ?? []), ""],
    });

  const updateLanguage = (index: number, value: string) => {
    const newLanguages = [...(localization?.languages ?? [])];
    newLanguages[index] = value;
    onLocalizationChange({ ...localization, languages: newLanguages });
  };

  const removeLanguage = (index: number) => {
    const newLanguages = [...(localization?.languages ?? [])];
    newLanguages.splice(index, 1);
    onLocalizationChange({ ...localization, languages: newLanguages });
  };

  return (
    <div className="flex flex-col gap-6">
      <Field.Root className="flex-row items-center">
        <Switch
          checked={localization?.isEnabled ?? false}
          onCheckedChange={toggleEnabled}
        />
        <Field.Label>Enable Localization</Field.Label>
      </Field.Root>

      {localization?.isEnabled && (
        <Field.Root>
          <Field.Label>
            Languages ({localization.languages?.length ?? 0})
          </Field.Label>
          <Field.Container>
            <div className="flex flex-col gap-2">
              {localization.languages?.map((lang, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <DebouncedTextInput
                    placeholder="e.g. English, French..."
                    defaultValue={lang}
                    onValueChange={(v) => updateLanguage(index, v)}
                  />
                  <Button
                    aria-label="Remove language"
                    onClick={() => removeLanguage(index)}
                    variant="ghost"
                    size="icon"
                  >
                    <TrashIcon />
                  </Button>
                </div>
              ))}
              <Button onClick={addLanguage} variant="outline" size="sm">
                <PlusSignIcon />
                Add Language
              </Button>
            </div>
          </Field.Container>
        </Field.Root>
      )}
    </div>
  );
};
