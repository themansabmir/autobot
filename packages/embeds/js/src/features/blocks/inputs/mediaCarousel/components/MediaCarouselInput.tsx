import type { InputSubmitContent } from "@/types";
import type { MediaCarouselBlock } from "@typebot.io/blocks-inputs/mediaCarousel/schema";
import { createSignal, For, Show } from "solid-js";

type Props = {
  block: MediaCarouselBlock;
  onSubmit: (content: InputSubmitContent) => void;
};

export const MediaCarouselInput = (props: Props) => {
  const [selectedCardIndex, setSelectedCardIndex] = createSignal(0);

  // Debug logging
  console.log("MediaCarouselInput cards:", props.block.options?.cards);
  props.block.options?.cards?.forEach((card, i) => {
    console.log(`Card ${i} buttons:`, card.buttons);
  });

  const handleSubmit = (value: string) => {
    props.onSubmit({ type: "text", value });
  };

  const scrollLeft = () => {
    const container = document.getElementById("media-carousel-container");
    if (container) {
      container.scrollBy({ left: -250, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    const container = document.getElementById("media-carousel-container");
    if (container) {
      container.scrollBy({ left: 250, behavior: "smooth" });
    }
  };

  return (
    <div class="flex flex-col gap-2 w-full max-w-[350px]">
      <div class="relative group">
        <Show when={props.block.options?.bodyText}>
          <div class="p-3 bg-white rounded-lg shadow-sm border border-gray-100 mb-2 text-sm text-gray-800 whitespace-pre-wrap">
            {props.block.options?.bodyText}
          </div>
        </Show>

        <div
          id="media-carousel-container"
          class="flex overflow-x-auto gap-3 pb-4 snap-x snap-mandatory hide-scrollbar"
          style={{ "scrollbar-width": "none", "-ms-overflow-style": "none" }}
        >
          <For each={props.block.options?.cards}>
            {(card, index) => (
              <div class="flex-shrink-0 w-[240px] bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden snap-center flex flex-col">
                <Show when={card.headerUrl}>
                  <div class="h-32 w-full bg-gray-100 relative overflow-hidden">
                    <img
                      src={card.headerUrl}
                      alt={card.title || "Card Header"}
                      class="w-full h-full object-cover"
                    />
                  </div>
                </Show>
                
                <div class="p-3 flex-1 flex flex-col">
                  <Show when={card.title}>
                    <h3 class="font-bold text-gray-900 text-sm mb-1">
                      {card.title}
                    </h3>
                  </Show>
                  <Show when={card.bodyText}>
                    <p class="text-xs text-gray-600 mb-3 line-clamp-3">
                      {card.bodyText}
                    </p>
                  </Show>

                  <Show when={card.buttons}>
                    <div class="mt-auto pt-2 space-y-2">
                      <Show
                        when={card.buttons.type === "url"}
                        fallback={
                          <For each={card.buttons.type === "quick_reply" ? card.buttons.buttons : []}>
                            {(btn) => (
                              <button
                                class="w-full py-1.5 px-3 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                                onClick={() => handleSubmit(btn.title)}
                              >
                                {btn.title}
                              </button>
                            )}
                          </For>
                        }
                      >
                        <a
                          href={(card.buttons as any).url}
                          target="_blank"
                          rel="noopener noreferrer"
                          class="block w-full text-center py-1.5 px-3 text-xs font-medium text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
                          onClick={() => handleSubmit(`Clicked: ${(card.buttons as any).displayText}`)}
                        >
                          {(card.buttons as any).displayText || "Open Link"}
                        </a>
                      </Show>
                    </div>
                  </Show>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
  );
};
