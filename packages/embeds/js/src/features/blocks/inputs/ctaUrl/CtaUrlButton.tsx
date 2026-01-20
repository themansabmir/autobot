import type { CtaUrlInputBlock } from "@typebot.io/blocks-inputs/ctaUrl/schema";
import { Show } from "solid-js";
import { Button } from "@/components/Button";
import type { InputSubmitContent } from "@/types";

type Props = {
  block: CtaUrlInputBlock;
  onSubmit: (value: InputSubmitContent) => void;
};

export const CtaUrlButton = (props: Props) => {
  const handleClick = () => {
    const url = props.block.options?.url;
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    props.onSubmit({
      type: "text",
      value: props.block.options?.displayText || "Clicked",
    });
  };

  return (
    <div class="flex flex-col gap-2 w-full typebot-cta-url-input">
      <Show when={props.block.options?.bodyText}>
        <p class="text-sm whitespace-pre-wrap">
          {props.block.options?.bodyText}
        </p>
      </Show>
      <div class="flex justify-end">
        <Button on:click={handleClick} class="flex items-center gap-2">
          <span>{props.block.options?.displayText || "Click here"}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </Button>
      </div>
      <Show when={props.block.options?.footerText}>
        <p class="text-xs text-gray-500">{props.block.options?.footerText}</p>
      </Show>
    </div>
  );
};
