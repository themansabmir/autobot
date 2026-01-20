import { useMutation } from "@tanstack/react-query";
import type { Campaign } from "@typebot.io/schemas/features/campaign";
import { Menu } from "@typebot.io/ui/components/Menu";
import { Skeleton } from "@typebot.io/ui/components/Skeleton";
import { useOpenControls } from "@typebot.io/ui/hooks/useOpenControls";
import { MoreVerticalIcon } from "@typebot.io/ui/icons/MoreVerticalIcon";
import { cn } from "@typebot.io/ui/lib/cn";
import { format } from "date-fns";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useWorkspace } from "@/features/workspace/WorkspaceProvider";
import { trpc } from "@/lib/queryClient";

type Props = {
  campaigns: Campaign[] | undefined;
  isLoading: boolean;
  onCampaignDeleted: () => void;
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-3 text-yellow-11",
  SCHEDULED: "bg-blue-3 text-blue-11",
  RUNNING: "bg-orange-3 text-orange-11",
  COMPLETED: "bg-green-3 text-green-11",
  FAILED: "bg-red-3 text-red-11",
  PAUSED: "bg-gray-3 text-gray-11",
};

export const CampaignTable = ({
  campaigns,
  isLoading,
  onCampaignDeleted,
}: Props) => {
  const { workspace } = useWorkspace();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-11">
        <p>No campaigns yet. Create your first campaign to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-6">
      <table className="w-full">
        <thead className="bg-gray-2">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-11">
              Title
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-11">
              Status
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-11">
              Mode
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-11">
              Recipients
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-11">
              Progress
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-11">
              Created
            </th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-11">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-6">
          {campaigns.map((campaign) => (
            <CampaignRow
              key={campaign.id}
              campaign={campaign}
              workspaceId={workspace?.id ?? ""}
              onDeleted={onCampaignDeleted}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

type CampaignRowProps = {
  campaign: Campaign;
  workspaceId: string;
  onDeleted: () => void;
};

const CampaignRow = ({
  campaign,
  workspaceId,
  onDeleted,
}: CampaignRowProps) => {
  const deleteDialogControls = useOpenControls();
  const { mutate: deleteCampaign } = useMutation(
    trpc.campaigns.deleteCampaign.mutationOptions({
      onSuccess: onDeleted,
    }),
  );

  const progress =
    campaign.totalRecipients && campaign.totalRecipients > 0
      ? Math.round(
          ((campaign.sentCount + campaign.failedCount) /
            campaign.totalRecipients) *
            100,
        )
      : 0;

  return (
    <>
      <tr className="hover:bg-gray-2">
        <td className="px-4 py-3 text-sm font-medium text-gray-12">
          {campaign.title}
        </td>
        <td className="px-4 py-3">
          <span
            className={cn(
              "inline-flex items-center px-2 py-1 rounded-md text-xs font-medium",
              statusColors[campaign.status] ?? "bg-gray-3 text-gray-11",
            )}
          >
            {campaign.status}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-gray-11">
          {campaign.executionMode === "NOW" ? "Immediate" : "Scheduled"}
          {campaign.executeAt && (
            <span className="block text-xs text-gray-9">
              {format(new Date(campaign.executeAt), "MMM d, yyyy HH:mm")}
            </span>
          )}
        </td>
        <td className="px-4 py-3 text-sm text-gray-11">
          {campaign.totalRecipients ?? "-"}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-gray-4 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-9 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-11">
              {campaign.sentCount}/{campaign.totalRecipients ?? 0}
            </span>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-11">
          {format(new Date(campaign.createdAt), "MMM d, yyyy")}
        </td>
        <td className="px-4 py-3 text-right">
          <Menu.Root>
            <Menu.TriggerButton
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="Campaign actions"
            >
              <MoreVerticalIcon className="size-4" />
            </Menu.TriggerButton>
            <Menu.Popup align="end">
              <Menu.Item
                className="text-red-10"
                onClick={deleteDialogControls.onOpen}
              >
                Delete
              </Menu.Item>
            </Menu.Popup>
          </Menu.Root>
        </td>
      </tr>
      <ConfirmDialog
        confirmButtonLabel="Delete"
        title={`Delete "${campaign.title}"?`}
        onConfirm={() =>
          deleteCampaign({
            workspaceId,
            campaignId: campaign.id,
          })
        }
        actionType="destructive"
        isOpen={deleteDialogControls.isOpen}
        onClose={deleteDialogControls.onClose}
        // isLoading={isPending}
      >
        <p>
          Are you sure you want to delete this campaign? This action cannot be
          undone.
        </p>
      </ConfirmDialog>
    </>
  );
};
