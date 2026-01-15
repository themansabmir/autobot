import { DebouncedTextInputWithVariablesButton } from "@/components/inputs/DebouncedTextInput";
import { VariablesCombobox } from "@/components/inputs/VariablesCombobox";
import { createId } from "@paralleldrive/cuid2";
import { useTranslate } from "@tolgee/react";
import { defaultWhatsAppCarouselItem } from "@typebot.io/blocks-inputs/whatsappCarousel/constants";
import type { WhatsAppCarouselBlock } from "@typebot.io/blocks-inputs/whatsappCarousel/schema";
import { Button } from "@typebot.io/ui/components/Button";
import { Field } from "@typebot.io/ui/components/Field";
import { PlusSignIcon } from "@typebot.io/ui/icons/PlusSignIcon";
import { TrashIcon } from "@typebot.io/ui/icons/TrashIcon";
import type { Variable } from "@typebot.io/variables/schemas";
import { useState } from "react";

type Props = {
  options: WhatsAppCarouselBlock["options"];
  items: WhatsAppCarouselBlock["items"];
  onOptionsChange: (options: WhatsAppCarouselBlock["options"]) => void;
  onItemsChange: (items: WhatsAppCarouselBlock["items"]) => void;
};

export const WhatsAppCarouselSettings = ({
  options,
  items,
  onOptionsChange,
  onItemsChange,
}: Props) => {
  const { t } = useTranslate();
  const [selectedCardIndex, setSelectedCardIndex] = useState(0);

  const updateBodyText = (bodyText: string) =>
    onOptionsChange({ ...options, bodyText });

  const updateSaveVariable = (variable?: Variable) =>
    onOptionsChange({ ...options, variableId: variable?.id });

  const addCard = () => {
    const newCard = {
      ...defaultWhatsAppCarouselItem,
      id: createId(),
    };
    onItemsChange([...items, newCard]);
    setSelectedCardIndex(items.length);
  };

  const removeCard = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onItemsChange(newItems);
    if (selectedCardIndex >= newItems.length) {
      setSelectedCardIndex(Math.max(0, newItems.length - 1));
    }
  };

  const updateCard = (
    index: number,
    updates: Partial<WhatsAppCarouselBlock["items"][number]>
  ) => {
    const newItems = items.map((item, i) =>
      i === index ? { ...item, ...updates } : item
    );
    onItemsChange(newItems);
  };

  const canAddCard = items.length < 10;
  const canRemoveCard = items.length > 2;
  const selectedCard = items[selectedCardIndex];

  return (
    <div className="flex flex-col gap-4">
      {/* Main body text */}
      <Field.Root>
        <Field.Label>Message Body Text *</Field.Label>
        <DebouncedTextInputWithVariablesButton
          defaultValue={options?.bodyText ?? "Choose an option below:"}
          onValueChange={updateBodyText}
          placeholder="Main carousel message..."
          maxLength={1024}
        />
        <Field.Description>
          Main message displayed above the carousel (max 1024 chars)
        </Field.Description>
      </Field.Root>

      {/* Card management */}
      <Field.Root>
        <Field.Label>Carousel Cards ({items.length}/10) *</Field.Label>
        <Field.Description>
          Add 2-10 cards. Each card must have an image/video header.
        </Field.Description>
        
        {/* Card selector buttons */}
        <div className="flex flex-row gap-2 flex-wrap mt-2">
          {items.map((_, index) => (
            <Button
              key={index}
              size="sm"
              variant={selectedCardIndex === index ? "default" : "outline"}
              onClick={() => setSelectedCardIndex(index)}
            >
              Card {index + 1}
            </Button>
          ))}
          {canAddCard && (
            <Button
              size="icon"
              variant="outline"
              aria-label="Add card"
              onClick={addCard}
            >
              <PlusSignIcon />
            </Button>
          )}
        </div>
      </Field.Root>

      {/* Selected card editor */}
      {selectedCard && (
        <div className="flex flex-col gap-4 p-4 border rounded-md">
          <div className="flex flex-row justify-between items-center">
            <p className="font-semibold">Card {selectedCardIndex + 1} Settings</p>
            {canRemoveCard && (
              <Button
                size="icon"
                variant="ghost"
                aria-label="Remove card"
                onClick={() => removeCard(selectedCardIndex)}
              >
                <TrashIcon />
              </Button>
            )}
          </div>

          {/* Header type */}
          <Field.Root>
            <Field.Label>Header Type *</Field.Label>
            <div className="flex flex-row gap-2">
              <Button
                size="sm"
                variant={selectedCard.headerType === "image" ? "default" : "outline"}
                onClick={() =>
                  updateCard(selectedCardIndex, { headerType: "image" })
                }
              >
                Image
              </Button>
              <Button
                size="sm"
                variant={selectedCard.headerType === "video" ? "default" : "outline"}
                onClick={() =>
                  updateCard(selectedCardIndex, { headerType: "video" })
                }
              >
                Video
              </Button>
            </div>
          </Field.Root>

          {/* Header URL */}
          <Field.Root>
            <Field.Label>
              {selectedCard.headerType === "video" ? "Video" : "Image"} URL *
            </Field.Label>
            <DebouncedTextInputWithVariablesButton
              defaultValue={selectedCard.headerUrl ?? ""}
              onValueChange={(url) =>
                updateCard(selectedCardIndex, { headerUrl: url })
              }
              placeholder={`https://example.com/${selectedCard.headerType || "image"}.jpg`}
            />
          </Field.Root>

          {/* Card body text */}
          <Field.Root>
            <Field.Label>Card Body Text (Optional)</Field.Label>
            <DebouncedTextInputWithVariablesButton
              defaultValue={selectedCard.bodyText ?? ""}
              onValueChange={(text) =>
                updateCard(selectedCardIndex, { bodyText: text })
              }
              placeholder="Card description..."
              maxLength={160}
            />
            <Field.Description>Optional text for this card (max 160 chars)</Field.Description>
          </Field.Root>

          {/* Button type */}
          <Field.Root>
            <Field.Label>Button Type *</Field.Label>
            <div className="flex flex-row gap-2">
              <Button
                size="sm"
                variant={
                  selectedCard.buttonType === "cta_url" ? "default" : "outline"
                }
                onClick={() =>
                  updateCard(selectedCardIndex, {
                    buttonType: "cta_url",
                    quickReplyButtons: undefined,
                  })
                }
              >
                URL Button
              </Button>
              <Button
                size="sm"
                variant={
                  selectedCard.buttonType === "quick_reply" ? "default" : "outline"
                }
                onClick={() =>
                  updateCard(selectedCardIndex, {
                    buttonType: "quick_reply",
                    ctaUrlButton: undefined,
                  })
                }
              >
                Quick Reply
              </Button>
            </div>
            <Field.Description>
              All cards must use the same button type
            </Field.Description>
          </Field.Root>

          {/* URL Button settings */}
          {selectedCard.buttonType === "cta_url" && (
            <>
              <Field.Root>
                <Field.Label>Button Text *</Field.Label>
                <DebouncedTextInputWithVariablesButton
                  defaultValue={selectedCard.ctaUrlButton?.displayText ?? "Visit"}
                  onValueChange={(displayText) =>
                    updateCard(selectedCardIndex, {
                      ctaUrlButton: {
                        ...selectedCard.ctaUrlButton,
                        displayText,
                        url: selectedCard.ctaUrlButton?.url ?? "",
                      },
                    })
                  }
                  placeholder="Button label..."
                  maxLength={20}
                />
              </Field.Root>
              <Field.Root>
                <Field.Label>Button URL *</Field.Label>
                <DebouncedTextInputWithVariablesButton
                  defaultValue={selectedCard.ctaUrlButton?.url ?? ""}
                  onValueChange={(url) =>
                    updateCard(selectedCardIndex, {
                      ctaUrlButton: {
                        displayText:
                          selectedCard.ctaUrlButton?.displayText ?? "Visit",
                        url,
                      },
                    })
                  }
                  placeholder="https://example.com"
                />
              </Field.Root>
            </>
          )}

          {/* Quick Reply buttons settings */}
          {selectedCard.buttonType === "quick_reply" && (
            <Field.Root>
              <Field.Label>Quick Reply Buttons (1-2)</Field.Label>
              <Field.Description>
                Note: Quick reply buttons for carousels may have limited support.
                Consider using URL buttons instead.
              </Field.Description>
            </Field.Root>
          )}
        </div>
      )}

      {/* Save variable */}
      <Field.Root>
        <Field.Label>{t("blocks.inputs.settings.saveAnswer.label")}</Field.Label>
        <VariablesCombobox
          initialVariableId={options?.variableId}
          onSelectVariable={updateSaveVariable}
        />
      </Field.Root>
    </div>
  );
};
