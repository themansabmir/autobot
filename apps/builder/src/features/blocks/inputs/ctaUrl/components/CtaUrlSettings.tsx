import { defaultCtaUrlOptions } from "@typebot.io/blocks-inputs/ctaUrl/constants";
import type { CtaUrlInputBlock } from "@typebot.io/blocks-inputs/ctaUrl/schema";
import { Field } from "@typebot.io/ui/components/Field";
import { Input } from "@typebot.io/ui/components/Input";
import { Select } from "@typebot.io/ui/components/Select";
import { Textarea } from "@typebot.io/ui/components/Textarea";

type Props = {
  options: CtaUrlInputBlock["options"];
  onOptionsChange: (options: CtaUrlInputBlock["options"]) => void;
};

export const CtaUrlSettings = ({ options, onOptionsChange }: Props) => {
  const handleHeaderTypeChange = (value: string) =>
    onOptionsChange({
      ...options,
      headerType: value as "text" | "image" | "video" | "document",
    });

  const handleHeaderTextChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    onOptionsChange({ ...options, headerText: e.target.value });

  const handleHeaderImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    onOptionsChange({ ...options, headerImageUrl: e.target.value });

  const handleBodyTextChange = (value: string) =>
    onOptionsChange({ ...options, bodyText: value });

  const handleFooterTextChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    onOptionsChange({ ...options, footerText: e.target.value });

  const handleDisplayTextChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    onOptionsChange({ ...options, displayText: e.target.value });

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    onOptionsChange({ ...options, url: e.target.value });

  return (
    <div className="flex flex-col gap-4">
      <Field.Root>
        <Field.Label>Header Type</Field.Label>
        <Select.Root
          value={options?.headerType ?? defaultCtaUrlOptions.headerType}
          onValueChange={handleHeaderTypeChange}
        >
          <Select.Trigger />
          <Select.Popup>
            <Select.Item value="text">Text</Select.Item>
            <Select.Item value="image">Image</Select.Item>
            <Select.Item value="video">Video</Select.Item>
            <Select.Item value="document">Document</Select.Item>
          </Select.Popup>
        </Select.Root>
      </Field.Root>

      {options?.headerType === "text" && (
        <Field.Root>
          <Field.Label>Header Text</Field.Label>
          <Input
            placeholder="Enter header text (max 60 chars)"
            value={options?.headerText ?? ""}
            onChange={handleHeaderTextChange}
            maxLength={60}
          />
        </Field.Root>
      )}

      {options?.headerType === "image" && (
        <Field.Root>
          <Field.Label>Header Image URL</Field.Label>
          <Input
            placeholder="https://example.com/image.png"
            value={options?.headerImageUrl ?? ""}
            onChange={handleHeaderImageUrlChange}
          />
        </Field.Root>
      )}

      <Field.Root>
        <Field.Label>Body Text *</Field.Label>
        <Textarea
          placeholder="Enter body text (max 1024 chars)"
          value={options?.bodyText ?? ""}
          onValueChange={handleBodyTextChange}
          maxLength={1024}
        />
      </Field.Root>

      <Field.Root>
        <Field.Label>Footer Text</Field.Label>
        <Input
          placeholder="Enter footer text (max 60 chars)"
          value={options?.footerText ?? ""}
          onChange={handleFooterTextChange}
          maxLength={60}
        />
      </Field.Root>

      <Field.Root>
        <Field.Label>Button Text *</Field.Label>
        <Input
          placeholder="Click here (max 20 chars)"
          value={options?.displayText ?? defaultCtaUrlOptions.displayText}
          onChange={handleDisplayTextChange}
          maxLength={20}
        />
      </Field.Root>

      <Field.Root>
        <Field.Label>URL *</Field.Label>
        <Input
          placeholder="https://example.com"
          value={options?.url ?? ""}
          onChange={handleUrlChange}
        />
      </Field.Root>
    </div>
  );
};
