import { blockBaseSchema, optionBaseSchema } from "@typebot.io/blocks-base/schemas";
import { z } from "@typebot.io/zod";
import { InputBlockType } from "../constants";

export const ctaUrlHeaderTypeSchema = z.enum(["text", "image", "video", "document"]);
export type CtaUrlHeaderType = z.infer<typeof ctaUrlHeaderTypeSchema>;

export const ctaUrlOptionsSchema = optionBaseSchema.merge(
  z.object({
    headerType: ctaUrlHeaderTypeSchema.optional(),
    headerText: z.string().optional(),
    headerImageUrl: z.string().optional(),
    headerVideoUrl: z.string().optional(),
    headerDocumentUrl: z.string().optional(),
    bodyText: z.string().optional(),
    footerText: z.string().optional(),
    displayText: z.string().max(20).optional(),
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
    title: "CTA URL",
    ref: "ctaUrlInput",
  });

export type CtaUrlInputBlock = z.infer<typeof ctaUrlInputSchema>;
export type CtaUrlOptions = z.infer<typeof ctaUrlOptionsSchema>;
