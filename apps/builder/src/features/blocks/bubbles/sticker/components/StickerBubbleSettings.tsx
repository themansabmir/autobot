import { FileUploadContent } from "@/components/ImageUploadContent/FileUploadContent";
import type { FilePathUploadProps } from "@/features/upload/api/generateUploadUrl";
import type { StickerBubbleBlock } from "@typebot.io/blocks-bubbles/sticker/schema";
import { Field } from "@typebot.io/ui/components/Field";

type Props = {
  uploadFileProps: FilePathUploadProps;
  content?: StickerBubbleBlock["content"];
  onContentChange: (content: StickerBubbleBlock["content"]) => void;
};

export const StickerBubbleSettings = ({
  uploadFileProps,
  content,
  onContentChange,
}: Props) => {
  const updateUrl = (url: string) => {
    onContentChange({ ...content, url });
  };

  return (
    <div className="flex flex-col gap-4">
      <Field.Root>
        <Field.Label>Sticker URL or Media ID</Field.Label>
        <FileUploadContent
          uploadFileProps={uploadFileProps}
          defaultUrl={content?.url}
          fileType="image"
          placeholder="https://example.com/sticker.webp or {{variableName}}"
          onSubmit={updateUrl}
        />
        <Field.Description>
          Upload a WebP sticker (animated or static) or provide a URL/Media ID
        </Field.Description>
      </Field.Root>
    </div>
  );
};
