import {
    blockBaseSchema,
    optionBaseSchema,
} from "@typebot.io/blocks-base/schemas";
import { z } from "@typebot.io/zod";
import { InputBlockType } from "../constants";

export const addressInputOptionsSchema = optionBaseSchema.merge(
  z.object({
    content: z.string().optional(),
    countryCode: z.string().optional(),
    labels: z
      .object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        postalCode: z.string().optional(),
      })
      .optional(),
    required: z
      .object({
        street: z.boolean().optional(),
        city: z.boolean().optional(),
        state: z.boolean().optional(),
        country: z.boolean().optional(),
        postalCode: z.boolean().optional(),
      })
      .optional(),
  })
);

export const addressInputSchema = blockBaseSchema
  .merge(
    z.object({
      type: z.enum([InputBlockType.ADDRESS]),
      options: addressInputOptionsSchema.optional(),
    })
  )
  .openapi({
    title: "Address",
    ref: "addressInput",
  });

export type AddressInputBlock = z.infer<typeof addressInputSchema>;
