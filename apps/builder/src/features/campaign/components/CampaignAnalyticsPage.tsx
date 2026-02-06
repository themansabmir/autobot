"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@typebot.io/ui/components/Button";
import { Skeleton } from "@typebot.io/ui/components/Skeleton";
import { ArrowLeft01Icon } from "@typebot.io/ui/icons/ArrowLeft01Icon";
import { Download01Icon } from "@typebot.io/ui/icons/Download01Icon";
import { cn } from "@typebot.io/ui/lib/cn";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/lib/queryClient";
import { toast } from "@/lib/toast";
import { exportCampaignAnalytics } from "../helpers/exportCampaignAnalytics";

type Props = {
  workspaceId: string;
  campaignId: string;
};

type MetricCardProps = {
  title: string;
  value: number;
  total: number;
  color: string;
  icon: string;
  description?: string;
};

const MetricCard = ({
  title,
  value,
  total,
  color,
  icon,
  description,
}: MetricCardProps) => {
  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-6 bg-gradient-to-br from-gray-1 to-gray-2 p-6 transition-all hover:shadow-lg hover:border-gray-7">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-11">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-12">{value}</span>
            <span className="text-sm text-gray-10">/ {total}</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-4 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", color)}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-11">
              {percentage}%
            </span>
          </div>
          {description && (
            <p className="mt-2 text-xs text-gray-10">{description}</p>
          )}
        </div>
        <div className="text-4xl opacity-20">{icon}</div>
      </div>
    </div>
  );
};

type FunnelStepProps = {
  label: string;
  value: number;
  total: number;
  color: string;
  isLast?: boolean;
};

const FunnelStep = ({
  label,
  value,
  total,
  color,
  isLast,
}: FunnelStepProps) => {
  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
  const width = total > 0 ? (value / total) * 100 : 0;

  return (
    <div className="relative">
      <div className="flex items-center gap-4 mb-2">
        <span className="text-sm font-medium text-gray-12 min-w-[100px]">
          {label}
        </span>
        <div className="flex-1 h-12 bg-gray-3 rounded-lg overflow-hidden relative">
          <div
            className={cn(
              "h-full flex items-center justify-between px-4 transition-all duration-500",
              color,
            )}
            style={{ width: `${width}%` }}
          >
            <span className="text-sm font-bold text-white">{value}</span>
            <span className="text-xs font-medium text-white/90">
              {percentage}%
            </span>
          </div>
        </div>
      </div>
      {!isLast && (
        <div className="flex justify-center my-1">
          <div className="text-gray-9">↓</div>
        </div>
      )}
    </div>
  );
};

export const CampaignAnalyticsPage = ({ workspaceId, campaignId }: Props) => {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading } = useQuery(
    trpc.campaigns.getCampaignAnalytics.queryOptions({
      workspaceId,
      campaignId,
    }),
  );

  const { data: campaignData } = useQuery(
    trpc.campaigns.getCampaign.queryOptions({
      workspaceId,
      campaignId,
    }),
  );

  const handleExport = () => {
    if (!analytics || !campaign) {
      toast({
        type: "error",
        title: "No data to export",
        description: "Analytics data is not available yet.",
      });
      return;
    }

    try {
      setIsExporting(true);
      const filename = exportCampaignAnalytics(campaign, analytics);

      toast({
        type: "success",
        title: "Export successful!",
        description: `Analytics exported as ${filename}`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        type: "error",
        title: "Export failed",
        description: "Failed to export analytics. Please try again.",
      });
    } finally {
      setTimeout(() => setIsExporting(false), 500);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const analytics = data?.analytics;
  if (!analytics) return null;

  const campaign = campaignData?.campaign;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            aria-label="Go back"
          >
            <ArrowLeft01Icon className="size-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-12">
              Campaign Analytics
            </h1>
            {campaign && (
              <p className="text-sm text-gray-11 mt-1">{campaign.title}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting || !analytics}
            className="gap-2 transition-all hover:shadow-md"
            aria-label="Export analytics to CSV"
          >
            {isExporting ? (
              <>
                <div className="size-4 animate-spin rounded-full border-2 border-gray-11 border-t-transparent" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download01Icon className="size-4" />
                <span>Export to Excel</span>
              </>
            )}
          </Button>
          <div className="px-3 py-1.5 rounded-lg bg-blue-3 text-blue-11 text-sm font-medium">
            {campaign?.status}
          </div>
        </div>
      </div>

      {/* Conversion Rates - Moved to Top */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
        <div className="rounded-xl border border-gray-6 bg-gradient-to-br from-gray-1 to-gray-2 p-6 transition-all hover:shadow-lg hover:border-gray-7">
          <p className="text-sm font-medium text-gray-11">Delivery Rate</p>
          <p className="text-4xl font-bold text-gray-12 mt-2">
            {analytics.sent > 0
              ? ((analytics.delivered / analytics.sent) * 100).toFixed(1)
              : "0.0"}
            %
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 bg-gray-4 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-9 rounded-full"
                style={{
                  width: `${analytics.sent > 0 ? (analytics.delivered / analytics.sent) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
          <p className="text-xs text-gray-10 mt-2">Delivered / Sent</p>
        </div>
        <div className="rounded-xl border border-gray-6 bg-gradient-to-br from-gray-1 to-gray-2 p-6 transition-all hover:shadow-lg hover:border-gray-7">
          <p className="text-sm font-medium text-gray-11">Open Rate</p>
          <p className="text-4xl font-bold text-gray-12 mt-2">
            {analytics.delivered > 0
              ? ((analytics.opened / analytics.delivered) * 100).toFixed(1)
              : "0.0"}
            %
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 bg-gray-4 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-9 rounded-full"
                style={{
                  width: `${analytics.delivered > 0 ? (analytics.opened / analytics.delivered) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
          <p className="text-xs text-gray-10 mt-2">Opened / Delivered</p>
        </div>
        <div className="rounded-xl border border-gray-6 bg-gradient-to-br from-gray-1 to-gray-2 p-6 transition-all hover:shadow-lg hover:border-gray-7">
          <p className="text-sm font-medium text-gray-11">Completion Rate</p>
          <p className="text-4xl font-bold text-gray-12 mt-2">
            {analytics.started > 0
              ? ((analytics.completed / analytics.started) * 100).toFixed(1)
              : "0.0"}
            %
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 bg-gray-4 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-9 rounded-full"
                style={{
                  width: `${analytics.started > 0 ? (analytics.completed / analytics.started) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
          <p className="text-xs text-gray-10 mt-2">Completed / Started</p>
        </div>
      </div>

      {/* NPS Score Widget */}
      {analytics.nps && (
        <div className="rounded-xl border border-gray-6 bg-gradient-to-br from-gray-1 to-gray-2 p-6">
          <h2 className="text-lg font-bold text-gray-12 mb-4">
            Net Promoter Score (NPS)
          </h2>

          {/* Big NPS Score */}
          <div className="text-center mb-6">
            <div
              className={cn(
                "text-6xl font-bold",
                analytics.nps.score >= 50
                  ? "text-green-11"
                  : analytics.nps.score >= 0
                    ? "text-yellow-11"
                    : "text-red-11",
              )}
            >
              {analytics.nps.score}
            </div>
            <p className="text-sm text-gray-10 mt-2">
              {analytics.nps.totalResponses} responses (
              {analytics.nps.responseRate.toFixed(1)}%)
            </p>
          </div>

          {/* Distribution Bars */}
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-12 min-w-[120px]">
                Promoters (9-10)
              </span>
              <div className="flex-1 h-10 bg-gray-3 rounded-lg overflow-hidden relative">
                <div
                  className="h-full bg-green-9 flex items-center justify-between px-4 transition-all duration-500"
                  style={{
                    width: `${analytics.nps.totalResponses > 0 ? (analytics.nps.promoters / analytics.nps.totalResponses) * 100 : 0}%`,
                  }}
                >
                  <span className="text-sm font-bold text-white">
                    {analytics.nps.promoters}
                  </span>
                  <span className="text-xs font-medium text-white/90">
                    {analytics.nps.totalResponses > 0
                      ? (
                          (analytics.nps.promoters /
                            analytics.nps.totalResponses) *
                          100
                        ).toFixed(1)
                      : "0.0"}
                    %
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-12 min-w-[120px]">
                Passives (7-8)
              </span>
              <div className="flex-1 h-10 bg-gray-3 rounded-lg overflow-hidden relative">
                <div
                  className="h-full bg-yellow-9 flex items-center justify-between px-4 transition-all duration-500"
                  style={{
                    width: `${analytics.nps.totalResponses > 0 ? (analytics.nps.passives / analytics.nps.totalResponses) * 100 : 0}%`,
                  }}
                >
                  <span className="text-sm font-bold text-white">
                    {analytics.nps.passives}
                  </span>
                  <span className="text-xs font-medium text-white/90">
                    {analytics.nps.totalResponses > 0
                      ? (
                          (analytics.nps.passives /
                            analytics.nps.totalResponses) *
                          100
                        ).toFixed(1)
                      : "0.0"}
                    %
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-12 min-w-[120px]">
                Detractors (0-6)
              </span>
              <div className="flex-1 h-10 bg-gray-3 rounded-lg overflow-hidden relative">
                <div
                  className="h-full bg-red-9 flex items-center justify-between px-4 transition-all duration-500"
                  style={{
                    width: `${analytics.nps.totalResponses > 0 ? (analytics.nps.detractors / analytics.nps.totalResponses) * 100 : 0}%`,
                  }}
                >
                  <span className="text-sm font-bold text-white">
                    {analytics.nps.detractors}
                  </span>
                  <span className="text-xs font-medium text-white/90">
                    {analytics.nps.totalResponses > 0
                      ? (
                          (analytics.nps.detractors /
                            analytics.nps.totalResponses) *
                          100
                        ).toFixed(1)
                      : "0.0"}
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Recipients"
          value={analytics.total}
          total={analytics.total}
          color="bg-blue-9"
          icon="👥"
          description="Total contacts in campaign"
        />
        <MetricCard
          title="Messages Sent"
          value={analytics.sent}
          total={analytics.total}
          color="bg-green-9"
          icon="📤"
          description="Successfully sent to Meta"
        />
        <MetricCard
          title="Delivered"
          value={analytics.delivered}
          total={analytics.total}
          color="bg-purple-9"
          icon="✓"
          description="Reached user devices"
        />
        <MetricCard
          title="Opened"
          value={analytics.opened}
          total={analytics.total}
          color="bg-orange-9"
          icon="👁️"
          description="Users read the message"
        />
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Started Conversation"
          value={analytics.started}
          total={analytics.total}
          color="bg-cyan-9"
          icon="💬"
          description="Users replied to bot"
        />
        <MetricCard
          title="Completed Flow"
          value={analytics.completed}
          total={analytics.total}
          color="bg-teal-9"
          icon="🎯"
          description="Finished entire flow"
        />
        <MetricCard
          title="Failed"
          value={analytics.failed}
          total={analytics.total}
          color="bg-red-9"
          icon="⚠️"
          description="Delivery failures"
        />
      </div>

      {/* Conversion Funnel */}
      <div className="rounded-xl border border-gray-6 bg-gradient-to-br from-gray-1 to-gray-2 p-6">
        <h2 className="text-lg font-bold text-gray-12 mb-6">
          Conversion Funnel
        </h2>
        <div className="space-y-2">
          <FunnelStep
            label="Total"
            value={analytics.total}
            total={analytics.total}
            color="bg-gradient-to-r from-blue-9 to-blue-10"
          />
          <FunnelStep
            label="Sent"
            value={analytics.sent}
            total={analytics.total}
            color="bg-gradient-to-r from-green-9 to-green-10"
          />
          <FunnelStep
            label="Delivered"
            value={analytics.delivered}
            total={analytics.total}
            color="bg-gradient-to-r from-purple-9 to-purple-10"
          />
          <FunnelStep
            label="Opened"
            value={analytics.opened}
            total={analytics.total}
            color="bg-gradient-to-r from-orange-9 to-orange-10"
          />
          <FunnelStep
            label="Started"
            value={analytics.started}
            total={analytics.total}
            color="bg-gradient-to-r from-cyan-9 to-cyan-10"
          />
          <FunnelStep
            label="Completed"
            value={analytics.completed}
            total={analytics.total}
            color="bg-gradient-to-r from-teal-9 to-teal-10"
            isLast
          />
        </div>
      </div>

      {/* Detailed Stats Table */}
      <div className="rounded-xl border border-gray-6 bg-gradient-to-br from-gray-1 to-gray-2 overflow-hidden">
        <div className="p-6 border-b border-gray-6">
          <h2 className="text-lg font-bold text-gray-12">
            Detailed Statistics
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-3">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-11">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-11">
                  Count
                </th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-11">
                  Percentage
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-6">
              <tr className="hover:bg-gray-2">
                <td className="px-6 py-4 text-sm text-gray-12">Pending</td>
                <td className="px-6 py-4 text-sm text-right text-gray-12 font-medium">
                  {analytics.pending}
                </td>
                <td className="px-6 py-4 text-sm text-right text-gray-11">
                  {analytics.total > 0
                    ? ((analytics.pending / analytics.total) * 100).toFixed(1)
                    : "0.0"}
                  %
                </td>
              </tr>
              <tr className="hover:bg-gray-2">
                <td className="px-6 py-4 text-sm text-gray-12">Queued</td>
                <td className="px-6 py-4 text-sm text-right text-gray-12 font-medium">
                  {analytics.queued}
                </td>
                <td className="px-6 py-4 text-sm text-right text-gray-11">
                  {analytics.total > 0
                    ? ((analytics.queued / analytics.total) * 100).toFixed(1)
                    : "0.0"}
                  %
                </td>
              </tr>
              <tr className="hover:bg-gray-2">
                <td className="px-6 py-4 text-sm text-gray-12">Sent</td>
                <td className="px-6 py-4 text-sm text-right text-gray-12 font-medium">
                  {analytics.sent}
                </td>
                <td className="px-6 py-4 text-sm text-right text-gray-11">
                  {analytics.total > 0
                    ? ((analytics.sent / analytics.total) * 100).toFixed(1)
                    : "0.0"}
                  %
                </td>
              </tr>
              <tr className="hover:bg-gray-2">
                <td className="px-6 py-4 text-sm text-gray-12">Delivered</td>
                <td className="px-6 py-4 text-sm text-right text-gray-12 font-medium">
                  {analytics.delivered}
                </td>
                <td className="px-6 py-4 text-sm text-right text-gray-11">
                  {analytics.total > 0
                    ? ((analytics.delivered / analytics.total) * 100).toFixed(1)
                    : "0.0"}
                  %
                </td>
              </tr>
              <tr className="hover:bg-gray-2">
                <td className="px-6 py-4 text-sm text-gray-12">Opened</td>
                <td className="px-6 py-4 text-sm text-right text-gray-12 font-medium">
                  {analytics.opened}
                </td>
                <td className="px-6 py-4 text-sm text-right text-gray-11">
                  {analytics.total > 0
                    ? ((analytics.opened / analytics.total) * 100).toFixed(1)
                    : "0.0"}
                  %
                </td>
              </tr>
              <tr className="hover:bg-gray-2">
                <td className="px-6 py-4 text-sm text-gray-12">Started</td>
                <td className="px-6 py-4 text-sm text-right text-gray-12 font-medium">
                  {analytics.started}
                </td>
                <td className="px-6 py-4 text-sm text-right text-gray-11">
                  {analytics.total > 0
                    ? ((analytics.started / analytics.total) * 100).toFixed(1)
                    : "0.0"}
                  %
                </td>
              </tr>
              <tr className="hover:bg-gray-2">
                <td className="px-6 py-4 text-sm text-gray-12">Completed</td>
                <td className="px-6 py-4 text-sm text-right text-gray-12 font-medium">
                  {analytics.completed}
                </td>
                <td className="px-6 py-4 text-sm text-right text-gray-11">
                  {analytics.total > 0
                    ? ((analytics.completed / analytics.total) * 100).toFixed(1)
                    : "0.0"}
                  %
                </td>
              </tr>
              <tr className="hover:bg-gray-2 bg-red-2">
                <td className="px-6 py-4 text-sm text-red-11 font-medium">
                  Failed
                </td>
                <td className="px-6 py-4 text-sm text-right text-red-11 font-bold">
                  {analytics.failed}
                </td>
                <td className="px-6 py-4 text-sm text-right text-red-10">
                  {analytics.total > 0
                    ? ((analytics.failed / analytics.total) * 100).toFixed(1)
                    : "0.0"}
                  %
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
