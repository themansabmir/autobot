import { SendButton } from "@/components/SendButton";
import type { BotContext, InputSubmitContent } from "@/types";
import { defaultLocationRequestOptions } from "@typebot.io/blocks-inputs/locationRequest/constants";
import type { LocationRequestInputBlock } from "@typebot.io/blocks-inputs/locationRequest/schema";
import { cx } from "@typebot.io/ui/lib/cva";
import { createSignal, Show } from "solid-js";

type Props = {
  block: LocationRequestInputBlock;
  context: BotContext;
  onSubmit: (value: InputSubmitContent) => void;
};

export const LocationRequestInput = (props: Props) => {
  const [isRequesting, setIsRequesting] = createSignal(false);

  const handleLocationRequest = () => {
    setIsRequesting(true);
    
    // Check if geolocation is available
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Submit location data
          props.onSubmit({
            type: "text",
            value: JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            }),
          });
          setIsRequesting(false);
        },
        (error) => {
          // If user denies or error occurs, submit placeholder
          props.onSubmit({
            type: "text",
            value: "Location sharing declined",
          });
          setIsRequesting(false);
        }
      );
    } else {
      // Geolocation not supported, submit placeholder
      props.onSubmit({
        type: "text",
        value: "Location sharing not supported",
      });
      setIsRequesting(false);
    }
  };

  return (
    <div class="flex flex-col gap-2 w-full max-w-[350px]">
      <Show when={props.block.options?.requestText}>
        <p class="text-sm text-gray-600 mb-2">
          {props.block.options?.requestText ?? defaultLocationRequestOptions.requestText}
        </p>
      </Show>
      <SendButton
        type="button"
        on:click={handleLocationRequest}
        isDisabled={isRequesting()}
        class={cx(
          "w-full justify-center gap-2",
          "bg-green-500 hover:bg-green-600",
          "text-white font-medium"
        )}
      >
        <Show when={!isRequesting()}>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Send Location
        </Show>
        <Show when={isRequesting()}>
          Requesting location...
        </Show>
      </SendButton>
    </div>
  );
};
