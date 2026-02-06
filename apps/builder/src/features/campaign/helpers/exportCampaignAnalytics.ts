import type { Campaign } from "@typebot.io/schemas/features/campaign";

type AnalyticsData = {
  total: number;
  initiated: number;
  sent: number;
  delivered: number;
  opened: number;
  started: number;
  completed: number;
  failed: number;
  pending: number;
  queued: number;
};

export const exportCampaignAnalytics = (
  campaign: Campaign,
  analytics: AnalyticsData,
) => {
  // Helper function to calculate percentage
  const calcPercentage = (value: number, total: number): string => {
    return total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
  };

  // Helper function to calculate drop-off percentage
  const calcDropOff = (current: number, previous: number): string => {
    return previous > 0 ? ((current / previous) * 100).toFixed(1) : "0.0";
  };

  // Create CSV content with multiple sections
  const csvContent = [
    // Header
    "Campaign Analytics Export",
    "",
    
    // Campaign Overview Section
    "CAMPAIGN OVERVIEW",
    "Field,Value",
    `Campaign Name,${campaign.title}`,
    `Campaign ID,${campaign.id}`,
    `Status,${campaign.status}`,
    `Execution Mode,${campaign.executionMode === "NOW" ? "Immediate" : "Scheduled"}`,
    `Created At,${new Date(campaign.createdAt).toLocaleString()}`,
    `Export Date,${new Date().toLocaleString()}`,
    "",
    "",

    // Analytics Summary Section
    "ANALYTICS SUMMARY",
    "Metric,Count,Percentage,Description",
    `Total Recipients,${analytics.total},100.0%,Total contacts in campaign`,
    `Messages Sent,${analytics.sent},${calcPercentage(analytics.sent, analytics.total)}%,Successfully sent to Meta`,
    `Delivered,${analytics.delivered},${calcPercentage(analytics.delivered, analytics.total)}%,Reached user devices`,
    `Opened,${analytics.opened},${calcPercentage(analytics.opened, analytics.total)}%,Users read the message`,
    `Started Conversation,${analytics.started},${calcPercentage(analytics.started, analytics.total)}%,Users replied to bot`,
    `Completed Flow,${analytics.completed},${calcPercentage(analytics.completed, analytics.total)}%,Finished entire flow`,
    `Failed,${analytics.failed},${calcPercentage(analytics.failed, analytics.total)}%,Delivery failures`,
    `Pending,${analytics.pending},${calcPercentage(analytics.pending, analytics.total)}%,Not yet processed`,
    `Queued,${analytics.queued},${calcPercentage(analytics.queued, analytics.total)}%,In queue`,
    "",
    "",

    // Conversion Rates Section
    "CONVERSION RATES",
    "Metric,Value,Formula",
    `Delivery Rate,${calcPercentage(analytics.delivered, analytics.sent)}%,Delivered / Sent`,
    `Open Rate,${calcPercentage(analytics.opened, analytics.delivered)}%,Opened / Delivered`,
    `Engagement Rate,${calcPercentage(analytics.started, analytics.opened)}%,Started / Opened`,
    `Completion Rate,${calcPercentage(analytics.completed, analytics.started)}%,Completed / Started`,
    `Overall Conversion,${calcPercentage(analytics.completed, analytics.total)}%,Completed / Total`,
    "",
    "",

    // Funnel Analysis Section
    "FUNNEL ANALYSIS",
    "Stage,Count,% of Total,% of Previous Stage,Drop-off",
    `Total Recipients,${analytics.total},100.0%,-,-`,
    `Sent,${analytics.sent},${calcPercentage(analytics.sent, analytics.total)}%,${calcDropOff(analytics.sent, analytics.total)}%,${analytics.total - analytics.sent}`,
    `Delivered,${analytics.delivered},${calcPercentage(analytics.delivered, analytics.total)}%,${calcDropOff(analytics.delivered, analytics.sent)}%,${analytics.sent - analytics.delivered}`,
    `Opened,${analytics.opened},${calcPercentage(analytics.opened, analytics.total)}%,${calcDropOff(analytics.opened, analytics.delivered)}%,${analytics.delivered - analytics.opened}`,
    `Started,${analytics.started},${calcPercentage(analytics.started, analytics.total)}%,${calcDropOff(analytics.started, analytics.opened)}%,${analytics.opened - analytics.started}`,
    `Completed,${analytics.completed},${calcPercentage(analytics.completed, analytics.total)}%,${calcDropOff(analytics.completed, analytics.started)}%,${analytics.started - analytics.completed}`,
    "",
    "",

    // Status Breakdown Section
    "STATUS BREAKDOWN",
    "Status,Count,Percentage",
    `Pending,${analytics.pending},${calcPercentage(analytics.pending, analytics.total)}%`,
    `Queued,${analytics.queued},${calcPercentage(analytics.queued, analytics.total)}%`,
    `Sent,${analytics.sent},${calcPercentage(analytics.sent, analytics.total)}%`,
    `Delivered,${analytics.delivered},${calcPercentage(analytics.delivered, analytics.total)}%`,
    `Opened,${analytics.opened},${calcPercentage(analytics.opened, analytics.total)}%`,
    `Started,${analytics.started},${calcPercentage(analytics.started, analytics.total)}%`,
    `Completed,${analytics.completed},${calcPercentage(analytics.completed, analytics.total)}%`,
    `Failed,${analytics.failed},${calcPercentage(analytics.failed, analytics.total)}%`,
  ].join("\n");

  // Create filename with sanitized campaign name
  const sanitizedName = campaign.title
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase();
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .slice(0, 19);
  const filename = `${sanitizedName}_${campaign.id.slice(0, 8)}_analytics_${timestamp}.csv`;

  // Create blob and trigger download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return filename;
};
