import { BasicSelect } from "@/components/inputs/BasicSelect";
import { DebouncedTextInputWithVariablesButton } from "@/components/inputs/DebouncedTextInput";
import type { MediaCarouselBlock } from "@typebot.io/blocks-inputs/mediaCarousel/schema";
import { Button } from "@typebot.io/ui/components/Button";
import { PlusSignIcon } from "@typebot.io/ui/icons/PlusSignIcon";
import { TrashIcon } from "@typebot.io/ui/icons/TrashIcon";
import { useState } from "react";

type Props = {
  options?: MediaCarouselBlock["options"];
  onOptionsChange: (options: MediaCarouselBlock["options"]) => void;
};

export const MediaCarouselSettings = ({ options, onOptionsChange }: Props) => {
  const cards = options?.cards ?? [];

  const updateBodyText = (bodyText: string) => {
    onOptionsChange({
      ...options,
      bodyText,
      cards,
    });
  };

  const addCard = () => {
    const newCard = {
      id: `card-${Date.now()}`,
      headerType: "image" as const,
      headerUrl: "",
      title: "",
      bodyText: "",
      buttons: {
        type: "url" as const,
        displayText: "",
        url: "",
      },
    };

    onOptionsChange({
      ...options,
      bodyText: options?.bodyText ?? "",
      cards: [...cards, newCard],
    });
  };

  const removeCard = (index: number) => {
    onOptionsChange({
      ...options,
      bodyText: options?.bodyText ?? "",
      cards: cards.filter((_, i) => i !== index),
    });
  };

  const updateCard = (index: number, updates: Partial<typeof cards[0]>) => {
    const updatedCards = [...cards];
    updatedCards[index] = { ...updatedCards[index], ...updates };
    onOptionsChange({
      ...options,
      bodyText: options?.bodyText ?? "",
      cards: updatedCards,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-sm font-medium mb-2 block">
          Main Message Body Text
        </label>
        <DebouncedTextInputWithVariablesButton
          defaultValue={options?.bodyText ?? ""}
          onValueChange={updateBodyText}
          placeholder="Enter main message text..."
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">
            Cards ({cards.length}/10)
          </label>
          <Button
            type="button"
            onClick={addCard}
            disabled={cards.length >= 10}
            size="sm"
            variant="outline"
          >
            <PlusSignIcon className="w-4 h-4 mr-1" />
            Add Card
          </Button>
        </div>

        {cards.length < 2 && (
          <p className="text-xs text-orange-600 font-semibold mb-2">
            ⚠️ WhatsApp requires at least 2 cards for this carousel.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {cards.map((card, index) => (
            <CardEditor
              key={card.id}
              card={card}
              index={index}
              onUpdate={(updates) => updateCard(index, updates)}
              onRemove={() => removeCard(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const CardEditor = ({
  card,
  index,
  onUpdate,
  onRemove,
}: {
  card: any;
  index: number;
  onUpdate: (updates: any) => void;
  onRemove: () => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(index === 0);

  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm font-medium flex-1 text-left"
        >
          Card {index + 1} {isExpanded ? "▼" : "▶"}
        </button>
        <Button
          type="button"
          onClick={onRemove}
          size="icon"
          variant="ghost"
        >
          <TrashIcon />
        </Button>
      </div>

      {isExpanded && (
        <div className="flex flex-col gap-3 mt-3">
          <div>
            <label className="text-xs font-medium mb-1 block">
              Header Type
            </label>
            <BasicSelect
              value={card.headerType}
              items={["image", "video"]}
              onChange={(value) => onUpdate({ headerType: value })}
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">
              Header URL ({card.headerType})
            </label>
            <DebouncedTextInputWithVariablesButton
              defaultValue={card.headerUrl}
              onValueChange={(value) => onUpdate({ headerUrl: value })}
              placeholder={`https://example.com/${card.headerType}.jpg`}
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">
              Title (optional)
            </label>
            <DebouncedTextInputWithVariablesButton
              defaultValue={card.title}
              onValueChange={(value) => onUpdate({ title: value })}
              placeholder="Card title..."
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">
              Body Text (optional)
            </label>
            <DebouncedTextInputWithVariablesButton
              defaultValue={card.bodyText}
              onValueChange={(value) => onUpdate({ bodyText: value })}
              placeholder="Card description..."
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">
              Button Type
            </label>
            <BasicSelect
              value={card.buttons.type}
              items={[
                { label: "URL Button", value: "url" },
                { label: "Quick Reply Buttons", value: "quick_reply" },
              ]}
              onChange={(value) =>
                onUpdate({
                  buttons:
                    value === "url"
                      ? { type: "url", displayText: "", url: "" }
                      : {
                          type: "quick_reply",
                          buttons: [{ id: "", title: "" }],
                        },
                })
              }
            />
          </div>

          {card.buttons.type === "url" && (
            <>
              <div>
                <label className="text-xs font-medium mb-1 block">
                  Button Text
                </label>
                <DebouncedTextInputWithVariablesButton
                  defaultValue={card.buttons.displayText}
                  onValueChange={(value) =>
                    onUpdate({
                      buttons: { ...card.buttons, displayText: value },
                    })
                  }
                  placeholder="Buy now"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">
                  Button URL
                </label>
                <DebouncedTextInputWithVariablesButton
                  defaultValue={card.buttons.url}
                  onValueChange={(value) =>
                    onUpdate({
                      buttons: { ...card.buttons, url: value },
                    })
                  }
                  placeholder="https://..."
                />
              </div>
            </>
          )}

          {card.buttons.type === "quick_reply" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium">
                  Quick Reply Buttons ({(card.buttons as any).buttons?.length || 0}/3)
                </label>
                <Button
                  type="button"
                  onClick={() => {
                    const currentButtons = (card.buttons as any).buttons || [];
                    if (currentButtons.length < 3) {
                      onUpdate({
                        buttons: {
                          type: "quick_reply",
                          buttons: [
                            ...currentButtons,
                            { id: `btn-${Date.now()}`, title: "" },
                          ],
                        },
                      });
                    }
                  }}
                  disabled={(card.buttons as any).buttons?.length >= 3}
                  size="sm"
                  variant="outline"
                >
                  <PlusSignIcon className="w-4 h-4 mr-1" />
                  Add Button
                </Button>
              </div>

              {((card.buttons as any).buttons?.length || 0) < 1 && (
                <p className="text-xs text-gray-500 mb-2">
                  Add at least 1 button (maximum 3)
                </p>
              )}

              <div className="space-y-2">
                {((card.buttons as any).buttons || []).map((btn: any, btnIndex: number) => (
                  <div key={btn.id} className="flex gap-2 items-center">
                    <div className="flex-1">
                      <DebouncedTextInputWithVariablesButton
                        defaultValue={btn.title}
                        onValueChange={(value) => {
                          const updatedButtons = [...((card.buttons as any).buttons || [])];
                          updatedButtons[btnIndex] = { ...updatedButtons[btnIndex], title: value };
                          onUpdate({
                            buttons: {
                              type: "quick_reply",
                              buttons: updatedButtons,
                            },
                          });
                        }}
                        placeholder={`Button ${btnIndex + 1}`}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        const updatedButtons = ((card.buttons as any).buttons || []).filter(
                          (_: any, i: number) => i !== btnIndex
                        );
                        onUpdate({
                          buttons: {
                            type: "quick_reply",
                            buttons: updatedButtons,
                          },
                        });
                      }}
                      size="icon"
                      variant="ghost"
                    >
                      <TrashIcon />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
