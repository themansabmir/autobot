import {
    blockBaseSchema,
    optionBaseSchema,
} from "@typebot.io/blocks-base/schemas";
import { z } from "@typebot.io/zod";
import { InputBlockType } from "../constants";

export const flowOptionsSchema = optionBaseSchema.merge(
  z.object({
    flowId: z.string().optional(),
    flowCta: z.string().optional(),
    flowAction: z.enum(["navigate", "data_exchange"]).optional(),
    flowActionPayload: z.record(z.any()).optional(),
  })
);

export const flowInputSchema = blockBaseSchema
  .merge(
    z.object({
      type: z.enum([InputBlockType.FLOW]),
      options: flowOptionsSchema.optional(),
    })
  )
  .openapi({
    title: "WhatsApp Flow",
    ref: "flowInput",
  });

export type FlowInputBlock = z.infer<typeof flowInputSchema>;
