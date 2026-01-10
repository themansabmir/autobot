import {
    blockBaseSchema,
    optionBaseSchema,
} from "@typebot.io/blocks-base/schemas";
import { z } from "@typebot.io/zod";
import { InputBlockType } from "../constants";

const productCarouselCardSchema = z.object({
  id: z.string(),
  productRetailerId: z.string(),
});

export type ProductCarouselCard = z.infer<typeof productCarouselCardSchema>;

const productCarouselOptionsSchema = optionBaseSchema.extend({
  bodyText: z.string(),
  catalogId: z.string(),
  cards: z.array(productCarouselCardSchema).min(0).max(10),
});

export type ProductCarouselOptions = z.infer<typeof productCarouselOptionsSchema>;

export const productCarouselBlockSchema = blockBaseSchema.merge(
  z.object({
    type: z.literal(InputBlockType.PRODUCT_CAROUSEL),
    options: productCarouselOptionsSchema.optional(),
  })
);

export type ProductCarouselBlock = z.infer<typeof productCarouselBlockSchema>;
