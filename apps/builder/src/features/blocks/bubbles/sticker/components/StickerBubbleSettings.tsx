import { ImageUploadContent } from "@/components/ImageUploadContent";
import type { FilePathUploadProps } from "@/features/upload/api/generateUploadUrl";
import type { StickerBubbleBlock } from "@typebot.io/blocks-bubbles/sticker/schema";

type Props = {
  uploadFileProps: FilePathUploadProps;
  block: StickerBubbleBlock;
  onContentChange: (content: StickerBubbleBlock["content"]) => void;
};

export const StickerBubbleSettings = ({
  uploadFileProps,
  block,
  onContentChange,
}: Props) => {
  const updateSticker = (url: string) => {
    onContentChange({ ...block.content, url });
  };

  return (
    <div className="flex flex-col gap-4">
      <ImageUploadContent
        uploadFileProps={uploadFileProps}
        defaultUrl={block.content?.url}
        onSubmit={updateSticker}
      />
      <div className="text-sm text-gray-11">
        <strong>Note:</strong> WhatsApp stickers must be .webp format (animated or
        static), max 500KB
      </div>
    </div>
  );
};
