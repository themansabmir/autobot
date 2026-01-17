import { createId } from "@paralleldrive/cuid2";
import { blockTypeHasItems } from "@typebot.io/blocks-core/helpers";
import type { ItemV6 } from "@typebot.io/blocks-core/schemas/items/schema";
import type {
  BlockV6,
  BlockWithItems,
} from "@typebot.io/blocks-core/schemas/schema";
import { InputBlockType } from "@typebot.io/blocks-inputs/constants";
import { LogicBlockType } from "@typebot.io/blocks-logic/constants";

const parseDefaultItems = (type: BlockWithItems["type"]): ItemV6[] => {
  switch (type) {
    case InputBlockType.CHOICE:
    case InputBlockType.PICTURE_CHOICE:
    case LogicBlockType.CONDITION:
      return [{ id: createId() }];
    case InputBlockType.CARDS:
      return [
        {
          id: createId(),
          paths: [{ id: createId() }],
        },
      ];
    case LogicBlockType.AB_TEST:
      return [
        { id: createId(), path: "a" },
        { id: createId(), path: "b" },
      ];
    case InputBlockType.WHATSAPP_LIST:
      return [{ id: createId() }];
    case InputBlockType.WHATSAPP_CAROUSEL:
      return [
        {
          id: createId(),
          headerType: "image" as const,
          headerUrl: undefined,
          bodyText: undefined,
          buttonType: "cta_url" as const,
          ctaUrlButton: undefined,
          quickReplyButtons: undefined,
        },
        {
          id: createId(),
          headerType: "image" as const,
          headerUrl: undefined,
          bodyText: undefined,
          buttonType: "cta_url" as const,
          ctaUrlButton: undefined,
          quickReplyButtons: undefined,
        },
      ] as any; // Type assertion needed since carousel items have fields beyond generic ItemV6
  }
};

export const parseNewBlock = (type: BlockV6["type"]) =>
  ({
    id: createId(),
    type,

    ...(blockTypeHasItems(type)
      ? { items: parseDefaultItems(type) }
      : undefined),
  }) as BlockV6;
