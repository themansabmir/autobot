import { SendButton } from "@/components/SendButton";
import type { InputSubmitContent } from "@/types";
import { defaultTemplateOptions } from "@typebot.io/blocks-inputs/template/constants";
import type { TemplateInputBlock } from "@typebot.io/blocks-inputs/template/schema";
import { cx } from "@typebot.io/ui/lib/cva";
import { Show } from "solid-js";

type Props = {
  block: TemplateInputBlock;
  onSubmit: (value: InputSubmitContent) => void;
};

export const TemplateInput = (props: Props) => {
  const handleSendTemplate = () => {
    const templateData = {
      templateName: props.block.options?.templateName ?? defaultTemplateOptions.templateName,
      languageCode: props.block.options?.languageCode ?? defaultTemplateOptions.languageCode,
    };

    props.onSubmit({
      type: "text",
      value: JSON.stringify(templateData),
    });
  };

  return (
    <div class="flex flex-col gap-3 w-full max-w-[350px]">
      <div class="flex flex-col gap-2 p-4 border rounded-lg bg-gradient-to-br from-green-50 to-white">
        <div class="flex items-center gap-2 mb-2">
          <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span class="font-semibold text-gray-800">WhatsApp Template</span>
        </div>
        <Show when={props.block.options?.templateName}>
          <div class="text-sm">
            <span class="text-gray-600">Template: </span>
            <span class="font-medium text-gray-900">
              {props.block.options?.templateName}
            </span>
          </div>
        </Show>
        <Show when={props.block.options?.languageCode}>
          <div class="text-sm">
            <span class="text-gray-600">Language: </span>
            <span class="font-medium text-gray-900">
              {props.block.options?.languageCode}
            </span>
          </div>
        </Show>
      </div>
      <SendButton
        type="button"
        on:click={handleSendTemplate}
        class={cx(
          "w-full justify-center gap-2",
          "bg-green-500 hover:bg-green-600",
          "text-white font-medium"
        )}
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
        Send Template
      </SendButton>
    </div>
  );
};
