import type { StickerBubbleBlock } from "@typebot.io/blocks-bubbles/sticker/schema";
import { Badge } from "@typebot.io/ui/components/Badge";
import { ImageUploadContent } from "@/components/ImageUploadContent";
import type { FilePathUploadProps } from "@/features/upload/api/generateUploadUrl";

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
    onContentChange({ ...block.content, url, mediaId: undefined });
  };

  return (
    <div className="flex flex-col gap-4">
      <ImageUploadContent
        uploadFileProps={uploadFileProps}
        defaultUrl={block.content?.url}
        onSubmit={updateSticker}
      />

      {/* WhatsApp Upload Status */}
      {block.content?.url && (
        <div className="flex flex-col gap-2 p-3 border rounded-md bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">WhatsApp Integration</span>
            {block.content?.mediaId && (
              <Badge colorScheme="green">Uploaded ✓</Badge>
            )}
          </div>

          {block.content?.mediaId ? (
            <div className="text-xs text-gray-600 dark:text-gray-400 font-mono">
              Media ID: {block.content.mediaId.slice(0, 24)}...
            </div>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              💡 Sticker will be automatically uploaded to WhatsApp when you
              publish this typebot
            </p>
          )}
        </div>
      )}

      <div className="text-sm text-gray-600 dark:text-gray-400">
        <strong>Requirements:</strong> WhatsApp stickers must be .webp format,
        512×512 pixels, max 100KB
      </div>
    </div>
  );
};
