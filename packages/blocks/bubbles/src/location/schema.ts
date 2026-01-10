import { blockBaseSchema } from "@typebot.io/blocks-base/schemas";
import { z } from "@typebot.io/zod";
import { BubbleBlockType } from "../constants";

export const locationBubbleContentSchema = z.object({
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  name: z.string().optional(),
  address: z.string().optional(),
});

export const locationBubbleBlockSchema = blockBaseSchema
  .merge(
    z.object({
      type: z.enum([BubbleBlockType.LOCATION]),
      content: locationBubbleContentSchema.optional(),
    }),
  )
  .openapi({
    title: "Location",
    ref: `locationBlock`,
  });

export type LocationBubbleBlock = z.infer<typeof locationBubbleBlockSchema>;
