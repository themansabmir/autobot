import { DebouncedTextInputWithVariablesButton } from "@/components/inputs/DebouncedTextInput";
import type { ProductCarouselBlock } from "@typebot.io/blocks-inputs/productCarousel/schema";
import { Button } from "@typebot.io/ui/components/Button";
import { PlusSignIcon } from "@typebot.io/ui/icons/PlusSignIcon";
import { TrashIcon } from "@typebot.io/ui/icons/TrashIcon";

type Props = {
  options?: ProductCarouselBlock["options"];
  onOptionsChange: (options: ProductCarouselBlock["options"]) => void;
};

export const ProductCarouselSettings = ({ options, onOptionsChange }: Props) => {
  const cards = options?.cards ?? [];

  const updateBodyText = (bodyText: string) => {
    onOptionsChange({
      ...options,
      bodyText,
      catalogId: options?.catalogId ?? "",
      cards,
    });
  };

  const updateCatalogId = (catalogId: string) => {
    onOptionsChange({
      ...options,
      bodyText: options?.bodyText ?? "",
      catalogId,
      cards,
    });
  };

  const addCard = () => {
    const newCard = {
      id: `product-${Date.now()}`,
      productRetailerId: "",
    };

    onOptionsChange({
      ...options,
      bodyText: options?.bodyText ?? "",
      catalogId: options?.catalogId ?? "",
      cards: [...cards, newCard],
    });
  };

  const removeCard = (index: number) => {
    onOptionsChange({
      ...options,
      bodyText: options?.bodyText ?? "",
      catalogId: options?.catalogId ?? "",
      cards: cards.filter((_, i) => i !== index),
    });
  };

  const updateCard = (index: number, productRetailerId: string) => {
    const updatedCards = [...cards];
    updatedCards[index] = { ...updatedCards[index], productRetailerId };
    onOptionsChange({
      ...options,
      bodyText: options?.bodyText ?? "",
      catalogId: options?.catalogId ?? "",
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
          placeholder="Browse our products..."
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">
          Catalog ID
        </label>
        <DebouncedTextInputWithVariablesButton
          defaultValue={options?.catalogId ?? ""}
          onValueChange={updateCatalogId}
          placeholder="Enter WhatsApp catalog ID..."
        />
        <p className="text-xs text-gray-500 mt-1">
          All products must be from the same catalog
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">
            Products ({cards.length}/10)
          </label>
          <Button
            type="button"
            onClick={addCard}
            disabled={cards.length >= 10}
            size="sm"
            variant="outline"
          >
            <PlusSignIcon className="w-4 h-4 mr-1" />
            Add Product
          </Button>
        </div>

        {cards.length < 2 && (
          <p className="text-xs text-orange-600 font-semibold mb-2">
            ⚠️ WhatsApp requires at least 2 products for this carousel.
          </p>
        )}

        <div className="flex flex-col gap-2">
          {cards.map((card, index) => (
            <div key={card.id} className="flex gap-2 items-center border rounded-lg p-3">
              <div className="flex-1">
                <label className="text-xs font-medium mb-1 block">
                  Product {index + 1} - Retailer ID
                </label>
                <DebouncedTextInputWithVariablesButton
                  defaultValue={card.productRetailerId}
                  onValueChange={(value) => updateCard(index, value)}
                  placeholder="product-sku-123"
                />
              </div>
              <Button
                type="button"
                onClick={() => removeCard(index)}
                size="icon"
                variant="ghost"
              >
                <TrashIcon />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
