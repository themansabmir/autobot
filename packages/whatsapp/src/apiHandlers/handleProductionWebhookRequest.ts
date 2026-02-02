import * as Sentry from "@sentry/nextjs";
import { getSession } from "@typebot.io/chat-session/queries/getSession";
import { parseUnknownError } from "@typebot.io/lib/parseUnknownError";
import { after, type NextRequest } from "next/server";
import { extractErrorsFromEntry } from "../extractErrorsFromEntry";
import { groupIncomingWebhookEntriesPerUser } from "../groupIncomingWebhookEntriesPerUser";
import { parseWhatsAppWebhookBody } from "../parseWhatsAppWebhookBody";
import { resumeWhatsAppFlow } from "../resumeWhatsAppFlow";
import { WhatsAppError } from "../WhatsAppError";

const WHATSAPP_SESSION_ID_PREFIX = "wa-";
const WHATSAPP_PREVIEW_SESSION_ID_PREFIX = "wa-preview-";

import { RecipientStatus } from "@prisma/client";
import prisma from "@typebot.io/prisma";

export const handleProductionWebhookRequest = async (
  request: NextRequest,
  params: { workspaceId: string; credentialsId: string },
): Promise<Response> => {
  // In any case, we return a 200 response to avoid WhatsApp retrying the request
  const response = new Response("Message received", { status: 200 });

  const entry = await parseWhatsAppWebhookBody(request);

  if (!entry) return response;

  const errors = extractErrorsFromEntry(entry);

  if (errors.length > 0) {
    console.warn("Incoming WhatsApp errors", errors);
    Sentry.captureMessage("Incoming WhatsApp errors", {
      extra: {
        errors,
      },
    });
  }

  // Handle Status Updates from Meta Webhooks
  // Feature flag for enhanced analytics
  const useEnhancedAnalytics =
    process.env.ENABLE_ENHANCED_CAMPAIGN_ANALYTICS === "true";

  for (const { changes } of entry) {
    for (const change of changes) {
      if (change.value.statuses) {
        for (const status of change.value.statuses) {
          const recipient = await prisma.campaignRecipient.findFirst({
            where: { messageId: status.id },
          });

          if (!recipient) continue;

          // Determine which statuses to process based on feature flag
          const shouldProcess = useEnhancedAnalytics
            ? true // Process all statuses
            : status.status === "read"; // Legacy: only process 'read'

          if (!shouldProcess) continue;

          let updateData: {
            status?: RecipientStatus;
            sentAt?: Date;
            deliveredAt?: Date;
            openedAt?: Date;
            failedAt?: Date;
            errorCode?: string;
            errorMessage?: string;
          } = {};

          // Map Meta webhook statuses to our RecipientStatus
          switch (status.status) {
            case "sent":
              if (
                useEnhancedAnalytics &&
                (
                  [
                    RecipientStatus.QUEUED,
                    RecipientStatus.PENDING,
                  ] as RecipientStatus[]
                ).includes(recipient.status)
              ) {
                updateData = {
                  status: RecipientStatus.SENT,
                  sentAt: new Date(),
                };
              }
              break;

            case "delivered":
              if (
                useEnhancedAnalytics &&
                (
                  [
                    RecipientStatus.SENT,
                    RecipientStatus.QUEUED,
                    RecipientStatus.PENDING,
                  ] as RecipientStatus[]
                ).includes(recipient.status)
              ) {
                updateData = {
                  status: RecipientStatus.DELIVERED,
                  deliveredAt: new Date(),
                };
              }
              break;

            case "read":
              if (
                (
                  [
                    RecipientStatus.SENT,
                    RecipientStatus.DELIVERED,
                    RecipientStatus.QUEUED,
                    RecipientStatus.PENDING,
                  ] as RecipientStatus[]
                ).includes(recipient.status)
              ) {
                updateData = {
                  status: RecipientStatus.OPENED,
                  openedAt: new Date(),
                };
              }
              break;

            case "failed":
              if (
                useEnhancedAnalytics &&
                recipient.status !== RecipientStatus.FAILED
              ) {
                updateData = {
                  status: RecipientStatus.FAILED,
                  failedAt: new Date(),
                  errorCode: status.errors?.[0]?.code?.toString(),
                  errorMessage: status.errors?.[0]?.title,
                };
              }
              break;
          }

          // Apply the update if we have data to update
          if (Object.keys(updateData).length > 0) {
            await prisma.campaignRecipient.update({
              where: { id: recipient.id },
              data: updateData,
            });

            console.log(
              `✅ [Campaign Analytics] Recipient ${recipient.id} (${recipient.phoneNumber}) status updated: ${recipient.status} → ${updateData.status || recipient.status} (webhook: ${status.status})`,
            );
          }
        }
      }
    }
  }

  const incomingMessagesDetails = groupIncomingWebhookEntriesPerUser(entry);
  if (incomingMessagesDetails.size === 0) return response;

  // Allows us to process the event in the background and return the response right away
  // because WhatsApp expects a response in less than 3 seconds
  after(async () => {
    for (const [phoneNumberId, fromMap] of incomingMessagesDetails.entries()) {
      for (const [from, parsedEntries] of fromMap.entries()) {
        try {
          // Check if there's an existing preview session first
          // This handles the case where user starts chat from builder preview
          // but replies go to production webhook
          const previewSessionId = `${WHATSAPP_PREVIEW_SESSION_ID_PREFIX}${from}`;
          const productionSessionId = `${WHATSAPP_SESSION_ID_PREFIX}${phoneNumberId}-${from}`;

          const previewSession = await getSession(previewSessionId);
          const sessionId = previewSession?.state
            ? previewSessionId
            : productionSessionId;

          console.log("🔍 [DEBUG] Session ID selection:", {
            from,
            phoneNumberId,
            previewSessionId,
            productionSessionId,
            hasPreviewSession: !!previewSession,
            hasPreviewState: !!previewSession?.state,
            selectedSessionId: sessionId,
          });

          await resumeWhatsAppFlow({
            receivedMessages: parsedEntries.map(
              (parsedEntry) => parsedEntry.receivedMessages,
            ),
            sessionId,
            phoneNumberId,
            credentialsId: params.credentialsId,
            workspaceId: params.workspaceId,
            contact: {
              name: parsedEntries[0].contactName,
              phoneNumber: parsedEntries[0].contactPhoneNumber,
            },
            referral: parsedEntries[0].referral,
            callFrom: "webhook",
          });
        } catch (err) {
          if (err instanceof WhatsAppError) {
            console.log("Known WA error", err.message, err.details);
          } else {
            console.log("Sending unknown error to Sentry");
            const parsedError = await parseUnknownError({ err });
            console.log(parsedError);
            const details = safeJsonParse(parsedError.details);
            Sentry.addBreadcrumb({
              data:
                typeof details === "object" && details
                  ? details
                  : {
                      details,
                    },
            });
            Sentry.captureException(err);
          }
        }
      }
    }
  });

  return response;
};

const safeJsonParse = (value: string | undefined): unknown => {
  if (!value) return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};
