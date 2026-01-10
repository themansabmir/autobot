import {
    blockBaseSchema,
    optionBaseSchema,
} from "@typebot.io/blocks-base/schemas";
import { z } from "@typebot.io/zod";
import { InputBlockType } from "../constants";

export const locationRequestOptionsSchema = optionBaseSchema.merge(
  z.object({
    requestText: z.string().optional(),
  })
);

export const locationRequestInputSchema = blockBaseSchema
  .merge(
    z.object({
      type: z.enum([InputBlockType.LOCATION_REQUEST]),
      options: locationRequestOptionsSchema.optional(),
    })
  )
  .openapi({
    title: "Location Request",
    ref: "locationRequestInput",
  });

export type LocationRequestInputBlock = z.infer<
  typeof locationRequestInputSchema
>;
