import { commonLanguages } from "@typebot.io/lib/languages";
import type { Settings } from "@typebot.io/settings/schemas";
import { Button } from "@typebot.io/ui/components/Button";
import { Field } from "@typebot.io/ui/components/Field";
import { Switch } from "@typebot.io/ui/components/Switch";
import { PlusSignIcon } from "@typebot.io/ui/icons/PlusSignIcon";
import { TrashIcon } from "@typebot.io/ui/icons/TrashIcon";
import { useState } from "react";
import { BasicAutocompleteInput } from "@/components/inputs/BasicAutocompleteInput";
import { DebouncedTextInput } from "@/components/inputs/DebouncedTextInput";

type Props = {
  localization: Settings["localization"] | undefined;
  onLocalizationChange: (localization: Settings["localization"]) => void;
};

export const LocalizationForm = ({
  localization,
  onLocalizationChange,
}: Props) => {
  const [selectedLanguage, setSelectedLanguage] = useState("");

  const toggleEnabled = (isEnabled: boolean) =>
    onLocalizationChange({ ...localization, isEnabled });

  const addLanguage = () => {
    if (!selectedLanguage) return;
    const supportedName = commonLanguages.find(
      (l) => l.toLowerCase() === selectedLanguage.toLowerCase(),
    );
    if (!supportedName) return;
    onLocalizationChange({
      ...localization,
      languages: [...(localization?.languages ?? []), supportedName],
    });
    setSelectedLanguage("");
  };

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
            <div className="flex flex-col gap-4">
              <div className="flex gap-2 items-center pb-2 border-b border-gray-4">
                <div className="flex-1">
                  <BasicAutocompleteInput
                    placeholder="Search language... (e.g. Spanish)"
                    value={selectedLanguage}
                    items={commonLanguages}
                    onChange={(v) => setSelectedLanguage(v ?? "")}
                    debounceTimeout={0}
                  />
                </div>
                <Button
                  onClick={addLanguage}
                  variant="outline"
                  size="sm"
                  disabled={
                    !selectedLanguage ||
                    !commonLanguages.some(
                      (l) => l.toLowerCase() === selectedLanguage.toLowerCase(),
                    )
                  }
                >
                  <PlusSignIcon />
                  Add
                </Button>
              </div>

              <div className="flex flex-col gap-2">
                {localization.languages?.map((lang, index) => (
                  <div key={lang} className="flex gap-2 items-center">
                    <DebouncedTextInput
                      placeholder="e.g. English"
                      value={lang}
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
                {(!localization.languages ||
                  localization.languages.length === 0) && (
                  <p className="text-sm text-gray-500 italic py-2">
                    No languages added yet.
                  </p>
                )}
              </div>
            </div>
          </Field.Container>
        </Field.Root>
      )}
    </div>
  );
};
