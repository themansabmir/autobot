import { DebouncedTextInputWithVariablesButton } from "@/components/inputs/DebouncedTextInput";
import { VariablesCombobox } from "@/components/inputs/VariablesCombobox";
import { useTypebot } from "@/features/editor/providers/TypebotProvider";
import type { InteractiveListInputBlock } from "@typebot.io/blocks-inputs/interactiveList/schema";
import { Button } from "@typebot.io/ui/components/Button";
import { Field } from "@typebot.io/ui/components/Field";
import { PlusSignIcon } from "@typebot.io/ui/icons/PlusSignIcon";
import { TrashIcon } from "@typebot.io/ui/icons/TrashIcon";
import { useState } from "react";

type Props = {
  options?: InteractiveListInputBlock["options"];
  onOptionsChange: (options: InteractiveListInputBlock["options"]) => void;
};

type Section = NonNullable<
  InteractiveListInputBlock["options"]
>["sections"][number];

type Row = Section["rows"][number];


export const InteractiveListSettings = ({ options, onOptionsChange }: Props) => {
  const { typebot } = useTypebot();
  const sections = options?.sections ?? [];

  const updateOption = <
    K extends keyof NonNullable<InteractiveListInputBlock["options"]>,
  >(
    key: K,
    value: NonNullable<InteractiveListInputBlock["options"]>[K]
  ) => {
    onOptionsChange({
      ...options,
      sections,
      [key]: value,
    });
  };

  const addSection = () => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      title: "",
      rows: [{ id: `row-${Date.now()}`, title: "New Item" }],
    };
    onOptionsChange({
      ...options,
      sections: [...sections, newSection],
    });
  };

  const removeSection = (index: number) => {
    onOptionsChange({
      ...options,
      sections: sections.filter((_, i) => i !== index),
    });
  };

  const updateSection = (index: number, updates: Partial<Section>) => {
    const updatedSections = [...sections];
    updatedSections[index] = { ...updatedSections[index], ...updates };
    onOptionsChange({
      ...options,
      sections: updatedSections,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Field.Root>
        <Field.Label>Header (optional)</Field.Label>
        <DebouncedTextInputWithVariablesButton
          defaultValue={options?.header ?? ""}
          onValueChange={(val) => updateOption("header", val)}
          placeholder="Menu Header"
        />
      </Field.Root>

      <Field.Root>
        <Field.Label>Body Text</Field.Label>
        <DebouncedTextInputWithVariablesButton
          defaultValue={options?.body ?? ""}
          onValueChange={(val) => updateOption("body", val)}
          placeholder="Please select an option"
        />
      </Field.Root>

      <Field.Root>
        <Field.Label>Footer (optional)</Field.Label>
        <DebouncedTextInputWithVariablesButton
          defaultValue={options?.footer ?? ""}
          onValueChange={(val) => updateOption("footer", val)}
          placeholder="Menu Footer"
        />
      </Field.Root>

      <Field.Root>
        <Field.Label>Select Button Text</Field.Label>
        <DebouncedTextInputWithVariablesButton
          defaultValue={options?.buttonText ?? ""}
          onValueChange={(val) => updateOption("buttonText", val)}
          placeholder="View Options"
        />
      </Field.Root>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Sections</label>
          <Button size="sm" variant="outline" onClick={addSection}>
            <PlusSignIcon className="w-4 h-4 mr-1" /> Add Section
          </Button>
        </div>

        {sections.map((section, sIndex) => (
          <SectionEditor
            key={section.id}
            section={section}
            onUpdate={(updates) => updateSection(sIndex, updates)}
            onRemove={() => removeSection(sIndex)}
          />
        ))}
      </div>

      <Field.Root>
        <Field.Label>Save Answer in Variable</Field.Label>
        <VariablesCombobox
          initialVariableId={options?.variableId}
          onSelectVariable={(v) => updateOption("variableId", v?.id)}
        />
      </Field.Root>
    </div>
  );
};

type SectionEditorProps = {
  section: Section;
  onUpdate: (updates: Partial<Section>) => void;
  onRemove: () => void;
};

const SectionEditor = ({ section, onUpdate, onRemove }: SectionEditorProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const addRow = () => {
    onUpdate({
      rows: [...(section.rows ?? []), { id: `row-${Date.now()}`, title: "" }],
    });
  };

  const updateRow = (index: number, updates: Partial<Row>) => {
    const updatedRows = [...(section.rows ?? [])];
    updatedRows[index] = { ...updatedRows[index], ...updates };
    onUpdate({ rows: updatedRows });
  };

  const removeRow = (index: number) => {
    onUpdate({ rows: (section.rows ?? []).filter((_, i) => i !== index) });
  };

  return (
    <div className="border rounded-lg p-3 bg-gray-50 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <button
          className="font-semibold text-sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "▼" : "▶"} {section.title || "Untitled Section"}
        </button>
        <Button size="icon" variant="ghost" onClick={onRemove}>
          <TrashIcon className="w-4 h-4 text-red-500" />
        </Button>
      </div>

      {isExpanded && (
        <div className="flex flex-col gap-3 mt-2">
          <Field.Root>
            <Field.Label>Section Title (optional)</Field.Label>
            <DebouncedTextInputWithVariablesButton
              defaultValue={section.title ?? ""}
              onValueChange={(title) => onUpdate({ title })}
              placeholder="Section 1"
            />
          </Field.Root>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium">Rows</label>
              <Button size="xs" variant="outline" onClick={addRow}>
                Add Row
              </Button>
            </div>

            {section.rows.map((row, rIndex) => (
              <div key={row.id} className="flex gap-2 items-start border-l-2 pl-2">
                <div className="flex-1 flex flex-col gap-1">
                  <DebouncedTextInputWithVariablesButton
                    defaultValue={row.title}
                    onValueChange={(title) => updateRow(rIndex, { title })}
                    placeholder="Row Title"
                  />
                  <DebouncedTextInputWithVariablesButton
                    defaultValue={row.description}
                    onValueChange={(description) =>
                      updateRow(rIndex, { description })
                    }
                    placeholder="Description (optional)"
                  />
                </div>
                <Button size="icon" variant="ghost" onClick={() => removeRow(rIndex)}>
                  <TrashIcon className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
