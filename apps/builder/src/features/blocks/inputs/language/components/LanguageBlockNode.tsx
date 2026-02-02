import { Badge } from "@typebot.io/ui/components/Badge";
import { useTypebot } from "@/features/editor/providers/TypebotProvider";
import type { LanguageBlock } from "@typebot.io/blocks-inputs/language/schema";

type Props = {
  block: LanguageBlock;
};

export const LanguageBlockNode = ({ block }: Props) => {
  const { typebot } = useTypebot();
  const languages = typebot?.settings.localization?.languages ?? [];
  const label = block.options?.labels?.placeholder ?? "Language selection:";

  return (
    <div className="flex flex-col gap-3 w-[90%] py-1">
      <p className="text-sm font-semibold truncate text-orange-9">{label}</p>
      <div className="flex flex-wrap gap-1.5 min-h-[1.5rem]">
        {languages.length > 0 ? (
          languages.map((lang, index) => (
            <Badge
              key={index}
              colorScheme="blue"
              className="bg-blue-3 dark:bg-blue-3/20 border border-blue-4 text-blue-11"
            >
              {lang}
            </Badge>
          ))
        ) : (
          <p className="text-xs text-gray-500 italic px-1">No languages defined</p>
        )}
      </div>
    </div>
  );
};
