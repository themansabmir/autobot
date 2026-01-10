import { FileUploadContent } from "@/components/ImageUploadContent/FileUploadContent";
import { DebouncedTextInputWithVariablesButton } from "@/components/inputs/DebouncedTextInput";
import type { FilePathUploadProps } from "@/features/upload/api/generateUploadUrl";
import type { DocumentBubbleBlock } from "@typebot.io/blocks-bubbles/document/schema";
import { Field } from "@typebot.io/ui/components/Field";

type Props = {
  uploadFileProps: FilePathUploadProps;
  content?: DocumentBubbleBlock["content"];
  onContentChange: (content: DocumentBubbleBlock["content"]) => void;
};

export const DocumentBubbleSettings = ({
  uploadFileProps,
  content,
  onContentChange,
}: Props) => {
  const updateUrl = (url: string) => {
    onContentChange({ ...content, url });
  };

  const updateFilename = (filename: string) => {
    onContentChange({ ...content, filename });
  };

  const updateCaption = (caption: string) => {
    onContentChange({ ...content, caption });
  };

  return (
    <div className="flex flex-col gap-4">
      <Field.Root>
        <Field.Label>File URL or Media ID</Field.Label>
        <FileUploadContent
          uploadFileProps={uploadFileProps}
          defaultUrl={content?.url}
          fileType="file"
          placeholder="https://example.com/document.pdf or {{variableName}}"
          onSubmit={updateUrl}
        />
      </Field.Root>

      <Field.Root>
        <Field.Label>Filename (optional)</Field.Label>
        <DebouncedTextInputWithVariablesButton
          defaultValue={content?.filename ?? ""}
          onValueChange={updateFilename}
          placeholder="invoice.pdf"
        />
      </Field.Root>

      <Field.Root>
        <Field.Label>Caption (optional)</Field.Label>
        <DebouncedTextInputWithVariablesButton
          defaultValue={content?.caption ?? ""}
          onValueChange={updateCaption}
          placeholder="Your document description"
        />
      </Field.Root>
    </div>
  );
};
