import {
    blockBaseSchema,
    optionBaseSchema,
} from "@typebot.io/blocks-base/schemas";
import { z } from "@typebot.io/zod";
import { InputBlockType } from "../constants";

const mediaCarouselCardButtonSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("url"),
    displayText: z.string(),
    url: z.string(),
  }),
  z.object({
    type: z.literal("quick_reply"),
    buttons: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
      })
    ).min(1).max(3),
  }),
]);

const mediaCarouselCardSchema = z.object({
  id: z.string(),
  headerType: z.enum(["image", "video"]),
  headerUrl: z.string(),
  title: z.string().optional(),
  bodyText: z.string().optional(),
  buttons: mediaCarouselCardButtonSchema,
});

export type MediaCarouselCard = z.infer<typeof mediaCarouselCardSchema>;

const mediaCarouselOptionsSchema = optionBaseSchema.extend({
  bodyText: z.string(),
  cards: z.array(mediaCarouselCardSchema).min(0).max(10),
});

export type MediaCarouselOptions = z.infer<typeof mediaCarouselOptionsSchema>;

export const mediaCarouselBlockSchema = blockBaseSchema.merge(
  z.object({
    type: z.literal(InputBlockType.MEDIA_CAROUSEL),
    options: mediaCarouselOptionsSchema.optional(),
  })
);

export type MediaCarouselBlock = z.infer<typeof mediaCarouselBlockSchema>;
