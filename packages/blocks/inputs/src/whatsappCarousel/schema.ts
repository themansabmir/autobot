import {
    blockBaseSchema,
    itemBaseSchemas,
    optionBaseSchema,
} from "@typebot.io/blocks-base/schemas";
import { z } from "@typebot.io/zod";
import { InputBlockType } from "../constants";

// Carousel CTA URL button
const carouselCtaUrlButtonSchema = z.object({
  displayText: z.string().max(20),
  url: z.string(),
});

// Carousel Quick Reply button
const carouselQuickReplyButtonSchema = z.object({
  id: z.string(),
  title: z.string().max(20),
});

// Carousel card item
export const whatsAppCarouselItemSchema = itemBaseSchemas.v6.extend({
  headerType: z.enum(["image", "video"]).nullish(),
  headerUrl: z.string().nullish(),
  bodyText: z.string().max(160).nullish(),
  
  // Button configuration
  buttonType: z.enum(["cta_url", "quick_reply"]).nullish(),
  ctaUrlButton: carouselCtaUrlButtonSchema.nullish(),
  quickReplyButtons: z.array(carouselQuickReplyButtonSchema).max(2).nullish(),
});

export type WhatsAppCarouselItem = z.infer<typeof whatsAppCarouselItemSchema>;

// Carousel options
const whatsAppCarouselOptionsSchema = optionBaseSchema.extend({
  bodyText: z.string().max(1024).optional(),
  variableId: z.string().optional(),
});

// Carousel block
export const whatsAppCarouselBlockSchema = blockBaseSchema.merge(
  z.object({
    type: z.literal(InputBlockType.WHATSAPP_CAROUSEL),
    items: z.array(whatsAppCarouselItemSchema),
    options: whatsAppCarouselOptionsSchema.optional(),
  })
);

export type WhatsAppCarouselBlock = z.infer<typeof whatsAppCarouselBlockSchema>;
