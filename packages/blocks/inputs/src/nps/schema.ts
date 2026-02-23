import {
  blockBaseSchema,
  optionBaseSchema,
} from "@typebot.io/blocks-base/schemas";
import { singleVariableOrNumberSchema } from "@typebot.io/variables/schemas";
import { z } from "@typebot.io/zod";
import { InputBlockType } from "../constants";

export const npsInputOptionsSchema = optionBaseSchema.merge(
  z.object({
    length: z.number().optional(),
    startsAt: singleVariableOrNumberSchema.optional(),
    labels: z
      .object({
        question: z.string().optional(),
        // Legacy: text labels removed — NPS uses startsAt/endsAt range only
        // lowLabel: z.string().optional(),
        // highLabel: z.string().optional(),
        button: z.string().optional(),
      })
      .optional(),
  }),
);

export const npsInputBlockSchema = blockBaseSchema
  .merge(
    z.object({
      type: z.literal(InputBlockType.NPS),
      options: npsInputOptionsSchema.optional(),
    }),
  )
  .openapi({
    title: "NPS",
    ref: "npsInput",
  });

export type NpsInputBlock = z.infer<typeof npsInputBlockSchema>;
