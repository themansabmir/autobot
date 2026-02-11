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

// Premium SVG Donut Chart Component
const DonutChart = ({
  data,
  total,
  score,
}: {
  data: { value: number; colorClass: string }[];
  total: number;
  score: number;
}) => {
  const size = 180;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;

  return (
    <div className="relative flex items-center justify-center size-[180px]">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-4"
        />
        {data.map((item, index) => {
          if (item.value === 0) return null;
          const dashArray = (item.value / total) * circumference;
          const offset = currentOffset;
          // Add gap only if there is more than one segment
          const gap = total > 0 && data.filter(d => d.value > 0).length > 1 ? 4 : 0; 
          currentOffset -= dashArray;

          return (
            <circle
              key={index}
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashArray - gap} ${circumference}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className={cn("transition-all duration-1000 ease-out", item.colorClass)}
            />
          );
        })}
      </svg>
      {/* Center Score */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs font-medium text-gray-11 uppercase tracking-wider">NPS</span>
        <span className={cn("text-4xl font-bold", 
           score >= 50 ? "text-green-11" : score >= 0 ? "text-[#f97316]" : "text-red-11"
        )}>
          {score}
        </span>
      </div>
    </div>
  );
};

// --- New Sub Components ---

const NpsScoreCard = ({ nps }: { nps: any }) => {
  const badgeColor = 
    nps.score >= 50 ? "bg-green-3 text-green-11 border-green-5" :
    nps.score >= 0 ? "bg-[#fff7ed] text-[#c2410c] border-[#ffedd5]" : // Orange-ish
    "bg-red-3 text-red-11 border-red-5";

  const badgeText = 
    nps.score >= 50 ? "Excellent" :
    nps.score >= 30 ? "Good" :
    nps.score >= 0 ? "Fair" : "Poor";

  return (
    <div className="rounded-xl border border-gray-6 bg-gradient-to-br from-gray-1 to-gray-2 p-6 flex flex-col justify-between min-h-[300px]">
      <div>
        <h3 className="text-sm font-medium text-gray-11 uppercase tracking-wider mb-2">Net Promoter Score</h3>
        <div className="flex items-baseline gap-2">
            <span className={cn("text-5xl font-bold", 
                nps.score >= 50 ? "text-green-9" : 
                nps.score >= 0 ? "text-[#f97316]" : "text-red-9"
            )}>
              {nps.score}
            </span>
            <span className={cn("text-xs px-2 py-0.5 rounded-full border border-solid", badgeColor)}>
                {badgeText}
            </span>
        </div>
        <p className="text-sm text-gray-10 mt-2">
          Based on {nps.totalResponses} responses
        </p>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-12 border-b border-gray-6 pb-2">Key Metrics</h4>
        <div className="flex justify-between text-sm">
            <span className="text-gray-11">Response Rate</span>
            <span className="font-medium text-gray-12">{nps.responseRate.toFixed(1)}%</span>
        </div>
         <div className="flex justify-between text-sm">
            <span className="text-gray-11">Promoters</span>
            <span className="font-medium text-green-11">{nps.promoters}</span>
        </div>
         <div className="flex justify-between text-sm">
            <span className="text-gray-11">Passives</span>
            <span className="font-medium text-[#c2410c]">{nps.passives}</span>
        </div>
         <div className="flex justify-between text-sm">
            <span className="text-gray-11">Detractors</span>
            <span className="font-medium text-red-11">{nps.detractors}</span>
        </div>
      </div>
    </div>
  );
};

const NpsDistributionChart = ({ 
  distribution,
  scale = { min: 0, max: 10 } 
}: { 
  distribution: Record<string, number>;
  scale?: { min: number; max: number };
}) => {
  // Find max value for scaling
  const maxVal = Math.max(...Object.values(distribution || {}), 0);
  const keys = Array.from({ length: scale.max - scale.min + 1 }, (_, i) => i + scale.min);

  return (
     <div className="rounded-xl border border-gray-6 bg-gradient-to-br from-gray-1 to-gray-2 p-6">
       <h3 className="text-sm font-medium text-gray-11 mb-6 uppercase tracking-wider">
         Score Distribution ({scale.min}-{scale.max})
       </h3>
       <div className="h-40 flex items-end gap-2 sm:gap-4">
         {keys.map((score) => {
           const count = distribution?.[score] || 0;
           const heightPercent = maxVal > 0 ? (count / maxVal) * 100 : 0;
           
           // Normalize score to 0-10 for coloring
           const normalized = scale.max === scale.min 
             ? 10 
             : ((score - scale.min) / (scale.max - scale.min)) * 10;

           const colorClass = normalized >= 9 ? "bg-green-9" : normalized >= 7 ? "bg-[#f97316]" : "bg-red-9";
           
           return (
             <div key={score} className="flex-1 flex flex-col items-center gap-2 group">
               <div className="w-full relative flex-1 flex items-end bg-gray-3/50 rounded-t-sm overflow-hidden">
                 <div 
                   className={cn("w-full transition-all duration-700 ease-out rounded-t-sm opacity-80 group-hover:opacity-100", colorClass)}
                   style={{ height: `${Math.max(heightPercent, 2)}%` }} // Min height for visibility
                 />
                 {/* Tooltip on hover */}
                 <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-12 text-gray-1 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                    {count} votes
                 </div>
               </div>
               <span className="text-xs font-medium text-gray-11">{score}</span>
             </div>
           );
         })}
       </div>
     </div>
  );
};

const NpsTrendChart = ({ trend }: { trend?: { date: string; score: number }[] }) => {
    if (!trend || trend.length < 2) {
        return (
             <div className="rounded-xl border border-gray-6 bg-gradient-to-br from-gray-1 to-gray-2 p-6 flex flex-col items-center justify-center min-h-[300px] text-gray-10 text-sm">
                 <span className="bg-gray-4 p-3 rounded-full mb-3 text-2xl">📉</span>
                 <p>Not enough data for trend</p>
             </div>
        );
    }

    // Chart dimensions
    const width = 300;
    const height = 150;
    const padding = 20;

    // Scales
    const minScore = -100;
    const maxScore = 100;
    const dates = trend.map(t => new Date(t.date).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);

    const getX = (dateStr: string) => {
        const d = new Date(dateStr).getTime();
        if (maxDate === minDate) return width / 2;
        return padding + ((d - minDate) / (maxDate - minDate)) * (width - 2 * padding);
    }

    const getY = (score: number) => {
        return height - padding - ((score - minScore) / (maxScore - minScore)) * (height - 2 * padding);
    }

    // Generate Path
    const points = trend.map(t => `${getX(t.date)},${getY(t.score)}`).join(" ");

    return (
        <div className="rounded-xl border border-gray-6 bg-gradient-to-br from-gray-1 to-gray-2 p-6 flex flex-col min-h-[300px]">
             <h3 className="text-sm font-medium text-gray-11 mb-6 uppercase tracking-wider">NPS Trend</h3>
             
             <div className="flex-1 flex items-center justify-center w-full">
                 <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                     {/* Zero Line */}
                     <line x1={padding} y1={getY(0)} x2={width - padding} y2={getY(0)} stroke="currentColor" className="text-gray-6" strokeDasharray="4 4" />
                     
                     {/* Data Line */}
                     <polyline 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        points={points} 
                        className="text-[#3b82f6]" 
                     />

                     {/* Data Points */}
                     {trend.map((t, i) => (
                         <circle 
                            key={i} 
                            cx={getX(t.date)} 
                            cy={getY(t.score)} 
                            r="3" 
                            className={cn("fill-current transition-all hover:r-4", 
                                t.score > 0 ? "text-[#3b82f6]" : "text-red-9"
                            )} 
                         />
                     ))}
                 </svg>
             </div>
             <div className="flex justify-between text-xs text-gray-10 mt-2">
                 <span>{trend[0].date}</span>
                 <span>{trend[trend.length - 1].date}</span>
             </div>
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

      {/* NPS Analysis Section */}
      {analytics.nps && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-12">NPS Analysis</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Score Card */}
            <NpsScoreCard nps={analytics.nps} />

            {/* 2. Sentiment Donut */}
            <div className="rounded-xl border border-gray-6 bg-gradient-to-br from-gray-1 to-gray-2 p-6 flex flex-col items-center justify-center min-h-[300px]">
              <h3 className="text-sm font-medium text-gray-11 mb-6 uppercase tracking-wider">Sentiment</h3>
              <DonutChart
                total={analytics.nps.totalResponses}
                score={analytics.nps.score}
                data={[
                  { value: analytics.nps.promoters, colorClass: "text-green-9" },
                  { value: analytics.nps.passives, colorClass: "text-[#f97316]" },
                  { value: analytics.nps.detractors, colorClass: "text-red-9" },
                ]}
              />
              <div className="flex gap-4 mt-6 text-xs text-gray-11">
                 <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-9"/>Promoters</div>
                 <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#f97316]"/>Passives</div>
                 <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-9"/>Detractors</div>
              </div>
            </div>

            {/* 3. Trend Line */}
            <NpsTrendChart trend={analytics.nps.trend} />
          </div>

          {/* 4. Detailed Distribution */}
          {/* 4. Detailed Distribution */}
          <NpsDistributionChart 
            distribution={analytics.nps.distribution} 
            scale={analytics.nps.scale}
          />
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Recipients"
          value={analytics.total}
          total={analytics.total}
          color="bg-[#3b82f6]"
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
          color="bg-[#a855f7]"
          icon="✓"
          description="Reached user devices"
        />
        <MetricCard
          title="Opened"
          value={analytics.opened}
          total={analytics.total}
          color="bg-[#f97316]"
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
          color="bg-[#6366f1]"
          icon="💬"
          description="Users replied to bot"
        />
        <MetricCard
          title="Completed Flow"
          value={analytics.completed}
          total={analytics.total}
          color="bg-[#ec4899]"
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
            color="bg-gradient-to-r from-[#3b82f6] to-[#60a5fa]"
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
            color="bg-gradient-to-r from-[#a855f7] to-[#c084fc]"
          />
          <FunnelStep
            label="Opened"
            value={analytics.opened}
            total={analytics.total}
            color="bg-gradient-to-r from-[#f97316] to-[#fb923c]"
          />
          <FunnelStep
            label="Started"
            value={analytics.started}
            total={analytics.total}
            color="bg-gradient-to-r from-[#6366f1] to-[#818cf8]"
          />
          <FunnelStep
            label="Completed"
            value={analytics.completed}
            total={analytics.total}
            color="bg-gradient-to-r from-[#ec4899] to-[#f472b6]"
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
                <td className="px-6 py-4 text-sm text-[#ec4899] font-medium">
                  Completed
                </td>
                <td className="px-6 py-4 text-sm text-right text-[#ec4899] font-bold">
                  {analytics.completed}
                </td>
                <td className="px-6 py-4 text-sm text-right text-[#f472b6]">
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
