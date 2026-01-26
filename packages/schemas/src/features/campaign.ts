import type { JsonValue } from "@prisma/client/runtime/library";
import type { Prisma } from "@typebot.io/prisma/types";
import { z } from "@typebot.io/zod";

export const campaignExecutionModeSchema = z.enum(["NOW", "SCHEDULED"]);

export const campaignStatusSchema = z.enum([
  "PENDING",
  "SCHEDULED",
  "RUNNING",
  "COMPLETED",
  "FAILED",
  "PAUSED",
]);

export const recipientStatusSchema = z.enum([
  "PENDING",
  "QUEUED",
  "SENT",
  "OPENED",
  "STARTED",
  "COMPLETED",
  "FAILED",
]);

export const campaignSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  title: z.string(),
  fileUrl: z.string(),
  executionMode: campaignExecutionModeSchema,
  executeAt: z.date().nullable(),
  status: campaignStatusSchema,
  totalRecipients: z.number().nullable(),
  sentCount: z.number(),
  failedCount: z.number(),
  startedAt: z.date().nullable(),
  completedAt: z.date().nullable(),
  errorMessage: z.string().nullable(),
  workspaceId: z.string(),
  typebotId: z.string(),
}) satisfies z.ZodType<Prisma.Campaign>;

export const campaignRecipientSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  campaignId: z.string(),
  phoneNumber: z.string(),
  messageId: z.string().nullable(),
  variables: z.custom<JsonValue>().nullable(),
  status: recipientStatusSchema,
  retryCount: z.number(),
  sentAt: z.date().nullable(),
  errorMessage: z.string().nullable(),
}) satisfies z.ZodType<Prisma.CampaignRecipient>;

export type Campaign = z.infer<typeof campaignSchema>;
export type CampaignExecutionMode = z.infer<typeof campaignExecutionModeSchema>;
export type CampaignStatus = z.infer<typeof campaignStatusSchema>;
export type CampaignRecipient = z.infer<typeof campaignRecipientSchema>;
export type RecipientStatus = z.infer<typeof recipientStatusSchema>;
