import { SendButton } from "@/components/SendButton";
import type { BotContext, InputSubmitContent } from "@/types";
import { defaultFlowOptions } from "@typebot.io/blocks-inputs/flow/constants";
import type { FlowInputBlock } from "@typebot.io/blocks-inputs/flow/schema";
import { cx } from "@typebot.io/ui/lib/cva";

type Props = {
  block: FlowInputBlock;
  context: BotContext;
  onSubmit: (value: InputSubmitContent) => void;
};

export const FlowInput = (props: Props) => {
  const handleFlowClick = () => {
    const flowData = {
      flowId: props.block.options?.flowId ?? defaultFlowOptions.flowId,
      flowAction: props.block.options?.flowAction ?? defaultFlowOptions.flowAction,
      flowCta: props.block.options?.flowCta ?? defaultFlowOptions.flowCta,
    };

    props.onSubmit({
      type: "text",
      value: JSON.stringify(flowData),
    });
  };

  return (
    <div class="flex flex-col gap-2 w-full max-w-[350px]">
      <div class="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span class="text-sm text-blue-900 font-medium">WhatsApp Flow</span>
      </div>
      <SendButton
        type="button"
        on:click={handleFlowClick}
        class={cx(
          "w-full justify-center gap-2",
          "bg-blue-500 hover:bg-blue-600",
          "text-white font-medium"
        )}
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
        {props.block.options?.flowCta ?? defaultFlowOptions.flowCta}
      </SendButton>
    </div>
  );
};
