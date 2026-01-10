import type { DocumentBubbleBlock } from "@typebot.io/blocks-bubbles/document/schema";

type Props = {
  block: DocumentBubbleBlock;
};

export const DocumentBubbleContent = ({ block }: Props) => {
  const { url, filename, caption } = block.content ?? {};

  if (!url && !filename && !caption) {
    return <div className="text-gray-500 italic">Configure document...</div>;
  }

  return (
    <div className="flex flex-col gap-1">
      {filename && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
            📄 {filename}
          </span>
        </div>
      )}
      {caption && <div className="text-sm text-gray-600">{caption}</div>}
      {url && !filename && (
        <div className="text-xs text-gray-500 truncate">{url}</div>
      )}
    </div>
  );
};
