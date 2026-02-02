import type { RecipientStatus } from "@prisma/client";

type CampaignLogData = {
  recipientId: string;
  phoneNumber: string;
  campaignId?: string;
  messageId?: string;
  oldStatus?: RecipientStatus;
  newStatus: RecipientStatus;
  source: "webhook" | "local";
  metadata?: Record<string, unknown>;
};

/**
 * Centralized logger for campaign status changes
 * Logs in JSON format for easy parsing and aggregation
 */
export const logCampaignStatus = (data: CampaignLogData) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type: "CAMPAIGN_STATUS_CHANGE",
    ...data,
  };

  console.log(JSON.stringify(logEntry));
};

/**
 * Log campaign errors
 */
export const logCampaignError = (data: {
  recipientId?: string;
  phoneNumber?: string;
  campaignId?: string;
  error: string;
  errorCode?: string;
  context?: string;
}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type: "CAMPAIGN_ERROR",
    ...data,
  };

  console.error(JSON.stringify(logEntry));
};

/**
 * Log webhook events
 */
export const logWebhookEvent = (data: {
  messageId: string;
  status: string;
  timestamp?: string;
  errorCode?: string;
  errorTitle?: string;
}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type: "WEBHOOK_EVENT",
    ...data,
  };

  console.log(JSON.stringify(logEntry));
};
