import { SendButton } from "@/components/SendButton";
import type { InputSubmitContent } from "@/types";
import { defaultCtaUrlOptions } from "@typebot.io/blocks-inputs/ctaUrl/constants";
import type { CtaUrlInputBlock } from "@typebot.io/blocks-inputs/ctaUrl/schema";
import { cx } from "@typebot.io/ui/lib/cva";

type Props = {
  block: CtaUrlInputBlock;
  onSubmit: (value: InputSubmitContent) => void;
};

export const CtaUrlInput = (props: Props) => {
  const handleClick = () => {
    const url = props.block.options?.url ?? defaultCtaUrlOptions.url;
    
    // Open URL in new tab
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    
    // Submit to continue the flow
    props.onSubmit({
      type: "text",
      value: props.block.options?.displayText ?? defaultCtaUrlOptions.displayText,
    });
  };

  return (
    <div class="flex flex-col gap-2 w-full">
      <SendButton
        type="button"
        on:click={handleClick}
        class={cx(
          "w-full justify-center",
          "bg-blue-500 hover:bg-blue-600",
          "text-white font-medium"
        )}
      >
        {props.block.options?.displayText ?? defaultCtaUrlOptions.displayText}
      </SendButton>
    </div>
  );
};
