import { DebouncedTextInputWithVariablesButton } from "@/components/inputs/DebouncedTextInput";
import type { LocationBubbleBlock } from "@typebot.io/blocks-bubbles/location/schema";
import { Field } from "@typebot.io/ui/components/Field";

type Props = {
  content?: LocationBubbleBlock["content"];
  onContentChange: (content: LocationBubbleBlock["content"]) => void;
};

export const LocationBubbleSettings = ({ content, onContentChange }: Props) => {
  const updateContent = (updates: Partial<LocationBubbleBlock["content"]>) => {
    onContentChange({
      ...content,
      ...updates,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Field.Root>
        <Field.Label>Latitude</Field.Label>
        <DebouncedTextInputWithVariablesButton
          defaultValue={content?.latitude ?? ""}
          onValueChange={(latitude) => updateContent({ latitude })}
          placeholder="37.7749"
        />
        <Field.Description>
          Latitude coordinate (e.g., 37.7749)
        </Field.Description>
      </Field.Root>

      <Field.Root>
        <Field.Label>Longitude</Field.Label>
        <DebouncedTextInputWithVariablesButton
          defaultValue={content?.longitude ?? ""}
          onValueChange={(longitude) => updateContent({ longitude })}
          placeholder="-122.4194"
        />
        <Field.Description>
          Longitude coordinate (e.g., -122.4194)
        </Field.Description>
      </Field.Root>

      <Field.Root>
        <Field.Label>Name (optional)</Field.Label>
        <DebouncedTextInputWithVariablesButton
          defaultValue={content?.name ?? ""}
          onValueChange={(name) => updateContent({ name })}
          placeholder="Philz Coffee"
        />
        <Field.Description>
          Name of the location
        </Field.Description>
      </Field.Root>

      <Field.Root>
        <Field.Label>Address (optional)</Field.Label>
        <DebouncedTextInputWithVariablesButton
          defaultValue={content?.address ?? ""}
          onValueChange={(address) => updateContent({ address })}
          placeholder="123 Main St, Palo Alto, CA 94301"
        />
        <Field.Description>
          Full address of the location
        </Field.Description>
      </Field.Root>
    </div>
  );
};
