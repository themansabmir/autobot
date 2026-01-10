import {
    blockBaseSchema,
    optionBaseSchema,
} from "@typebot.io/blocks-base/schemas";
import { z } from "@typebot.io/zod";
import { InputBlockType } from "../constants";

export const ctaUrlOptionsSchema = optionBaseSchema.merge(
  z.object({
    displayText: z.string().optional(),
    url: z.string().optional(),
  })
);

export const ctaUrlInputSchema = blockBaseSchema
  .merge(
    z.object({
      type: z.enum([InputBlockType.CTA_URL]),
      options: ctaUrlOptionsSchema.optional(),
    })
  )
  .openapi({
    title: "CTA URL Button",
    ref: "ctaUrlInput",
  });

export type CtaUrlInputBlock = z.infer<typeof ctaUrlInputSchema>;
