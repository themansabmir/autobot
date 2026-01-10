import { SendButton } from "@/components/SendButton";
import type { InputSubmitContent } from "@/types";
import { defaultAddressInputOptions } from "@typebot.io/blocks-inputs/address/constants";
import type { AddressInputBlock } from "@typebot.io/blocks-inputs/address/schema";
import { createSignal } from "solid-js";

type Props = {
  block: AddressInputBlock;
  onSubmit: (value: InputSubmitContent) => void;
};

export const AddressInput = (props: Props) => {
  const [street, setStreet] = createSignal("");
  const [city, setCity] = createSignal("");
  const [state, setState] = createSignal("");
  const [country, setCountry] = createSignal("");
  const [postalCode, setPostalCode] = createSignal("");

  const checkIfValid = () => {
    const options = props.block.options;
    if (options?.required?.street && !street()) return false;
    if (options?.required?.city && !city()) return false;
    if (options?.required?.state && !state()) return false;
    if (options?.required?.country && !country()) return false;
    if (options?.required?.postalCode && !postalCode()) return false;
    return true;
  };

  const handleSubmit = () => {
    if (!checkIfValid()) return;

    const addressData = {
      street: street(),
      city: city(),
      state: state(),
      country: country(),
      postalCode: postalCode(),
    };

    props.onSubmit({
      type: "text",
      value: JSON.stringify(addressData),
    });
  };

  const submitWhenEnter = (e: KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div class="flex flex-col gap-3 w-full max-w-[400px]">
      <div class="flex flex-col gap-2 p-3 border rounded-lg bg-white">
        <input
          type="text"
          class="typebot-input px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none"
          placeholder={
            props.block.options?.labels?.street ??
            (defaultAddressInputOptions.labels as any).street
          }
          value={street()}
          onInput={(e) => setStreet(e.currentTarget.value)}
          onKeyDown={submitWhenEnter}
          required={props.block.options?.required?.street}
        />
        <input
          type="text"
          class="typebot-input px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none"
          placeholder={
            props.block.options?.labels?.city ??
            (defaultAddressInputOptions.labels as any).city
          }
          value={city()}
          onInput={(e) => setCity(e.currentTarget.value)}
          onKeyDown={submitWhenEnter}
          required={props.block.options?.required?.city}
        />
        <div class="flex gap-2">
          <input
            type="text"
            class="typebot-input flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none"
            placeholder={
              props.block.options?.labels?.state ??
              (defaultAddressInputOptions.labels as any).state
            }
            value={state()}
            onInput={(e) => setState(e.currentTarget.value)}
            onKeyDown={submitWhenEnter}
            required={props.block.options?.required?.state}
          />
          <input
            type="text"
            class="typebot-input flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none"
            placeholder={
              props.block.options?.labels?.postalCode ??
              (defaultAddressInputOptions.labels as any).postalCode
            }
            value={postalCode()}
            onInput={(e) => setPostalCode(e.currentTarget.value)}
            onKeyDown={submitWhenEnter}
            required={props.block.options?.required?.postalCode}
          />
        </div>
        <input
          type="text"
          class="typebot-input px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none"
          placeholder={
            props.block.options?.labels?.country ??
            (defaultAddressInputOptions.labels as any).country
          }
          value={country()}
          onInput={(e) => setCountry(e.currentTarget.value)}
          onKeyDown={submitWhenEnter}
          required={props.block.options?.required?.country}
        />
      </div>
      <SendButton
        type="button"
        on:click={handleSubmit}
        isDisabled={!checkIfValid()}
        class="w-full justify-center"
      >
        Submit Address
      </SendButton>
    </div>
  );
};
