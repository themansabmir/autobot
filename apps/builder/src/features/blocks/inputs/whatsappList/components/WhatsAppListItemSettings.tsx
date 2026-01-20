import type { WhatsAppListItem } from "@typebot.io/blocks-inputs/whatsappList/schema";
import { Field } from "@typebot.io/ui/components/Field";
import { DebouncedTextInputWithVariablesButton } from "@/components/inputs/DebouncedTextInput";

type Props = {
  item: WhatsAppListItem;
  onSettingsChange: (updates: Partial<WhatsAppListItem>) => void;
};

export const WhatsAppListItemSettings = ({ item, onSettingsChange }: Props) => {
  const updateDescription = (description: string) =>
    onSettingsChange({
      ...item,
      description,
    });

  const updateSectionTitle = (sectionTitle: string) =>
    onSettingsChange({
      ...item,
      sectionTitle,
    });

  return (
    <div className="flex flex-col gap-4">
      <Field.Root>
        <Field.Label>Description (WhatsApp List)</Field.Label>
        <DebouncedTextInputWithVariablesButton
          defaultValue={item.description}
          onValueChange={updateDescription}
          placeholder="e.g. 50% OFF"
          maxLength={72}
        />
      </Field.Root>
      <Field.Root>
        <Field.Label>Section Title (WhatsApp List)</Field.Label>
        <DebouncedTextInputWithVariablesButton
          defaultValue={item.sectionTitle}
          onValueChange={updateSectionTitle}
          placeholder="e.g. Special Offers"
          maxLength={24}
        />
      </Field.Root>
    </div>
  );
};
