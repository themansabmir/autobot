import type { InputSubmitContent } from "@/types";
import type { ProductCarouselBlock } from "@typebot.io/blocks-inputs/productCarousel/schema";
import { For, Show } from "solid-js";

type Props = {
  block: ProductCarouselBlock;
  onSubmit: (content: InputSubmitContent) => void;
};

export const ProductCarouselInput = (props: Props) => {
  const handleSubmit = (value: string) => {
    props.onSubmit({ type: "text", value });
  };

  return (
    <div class="flex flex-col gap-2 w-full max-w-[350px]">
      <Show when={props.block.options?.bodyText}>
        <div class="p-3 bg-white rounded-lg shadow-sm border border-gray-100 mb-2 text-sm text-gray-800 whitespace-pre-wrap">
          {props.block.options?.bodyText}
        </div>
      </Show>

      <div
        class="flex overflow-x-auto gap-3 pb-4 snap-x snap-mandatory hide-scrollbar"
        style={{ "scrollbar-width": "none", "-ms-overflow-style": "none" }}
      >
        <For each={props.block.options?.cards}>
          {(card, index) => (
            <div class="flex-shrink-0 w-[160px] bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden snap-center flex flex-col">
              <div class="h-32 w-full bg-gray-100 flex items-center justify-center relative">
                {/* Placeholder for product image since we can't fetch real catalog images without backend */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="text-gray-400"
                >
                  <circle cx="8" cy="21" r="1" />
                  <circle cx="19" cy="21" r="1" />
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                </svg>
              </div>
              
              <div class="p-2 flex-1 flex flex-col">
                <p class="text-xs text-gray-500 mb-1">ID: {card.productRetailerId}</p>
                <div class="mt-auto">
                  <button
                    class="w-full py-1.5 px-2 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                    onClick={() => handleSubmit(`View Product ${card.productRetailerId}`)}
                  >
                    View Product
                  </button>
                </div>
              </div>
            </div>
          )}
        </For>
      </div>
      
      <div class="text-[10px] text-gray-400 text-center">
        Catalog ID: {props.block.options?.catalogId}
      </div>
    </div>
  );
};
