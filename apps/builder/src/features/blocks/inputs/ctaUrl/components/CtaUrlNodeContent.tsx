import type { CtaUrlOptions } from "@typebot.io/blocks-inputs/ctaUrl/schema";

type Props = {
  options?: CtaUrlOptions;
};

export const CtaUrlNodeContent = ({ options }: Props) => {
  if (!options?.url && !options?.displayText) {
    return <p className="text-gray-11 text-sm">Configure URL button...</p>;
  }

  return (
    <div className="flex flex-col gap-1">
      {options.bodyText && (
        <p className="text-sm text-gray-12 line-clamp-2">{options.bodyText}</p>
      )}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-3 rounded-md border border-orange-6">
        <span className="text-sm font-medium text-orange-11">
          {options.displayText || "Click here"}
        </span>
      </div>
      {options.url && (
        <p className="text-xs text-gray-10 truncate">{options.url}</p>
      )}
    </div>
  );
};
