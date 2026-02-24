import type { WhatsAppTemplateBlock } from "@typebot.io/blocks-bubbles/whatsappTemplate/schema";

type Props = {
  block: WhatsAppTemplateBlock;
};

export const WhatsAppTemplateContent = ({ block }: Props) => {
  const isConfigured = !!block.content?.templateName;

  return (
    <div className="flex flex-col gap-2 p-2 bg-gray-50 rounded-md border border-gray-200 w-full overflow-hidden">
      {!isConfigured && (
        <span className="text-gray-400 italic text-sm">Template not selected</span>
      )}
      {isConfigured && (
        <div className="flex flex-col gap-1">
          <p className="font-bold text-xs uppercase text-gray-500">WhatsApp Template</p>
          <p className="font-semibold text-sm truncate">{block.content?.templateName}</p>
          <p className="text-xs text-gray-400 prose prose-sm line-clamp-3">
             {block.content?.languageCode}
          </p>
          {block.content?.variableMappings && Object.keys(block.content.variableMappings).length > 0 && (
             <p className="text-[10px] text-blue-500 font-mono italic">
                {Object.keys(block.content.variableMappings).length} variables mapped
             </p>
          )}
        </div>
      )}
    </div>
  );
};
