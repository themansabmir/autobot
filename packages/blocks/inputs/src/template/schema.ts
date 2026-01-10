import {
    blockBaseSchema,
    optionBaseSchema,
} from "@typebot.io/blocks-base/schemas";
import { z } from "@typebot.io/zod";
import { InputBlockType } from "../constants";

export const templateParameterSchema = z.object({
  type: z.enum(["text", "currency", "date_time"]),
  value: z.string(),
});

export const templateOptionsSchema = optionBaseSchema.merge(
  z.object({
    templateName: z.string().optional(),
    languageCode: z.string().optional(),
    headerParameters: z.array(templateParameterSchema).optional(),
    bodyParameters: z.array(templateParameterSchema).optional(),
    buttonParameters: z.array(templateParameterSchema).optional(),
  })
);

export const templateInputSchema = blockBaseSchema
  .merge(
    z.object({
      type: z.enum([InputBlockType.TEMPLATE]),
      options: templateOptionsSchema.optional(),
    })
  )
  .openapi({
    title: "Template Message",
    ref: "templateInput",
  });

export type TemplateInputBlock = z.infer<typeof templateInputSchema>;
