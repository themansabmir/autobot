import { useQuery } from "@tanstack/react-query";
import { Button } from "@typebot.io/ui/components/Button";
import { useOpenControls } from "@typebot.io/ui/hooks/useOpenControls";
import { PlusSignIcon } from "@typebot.io/ui/icons/PlusSignIcon";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Seo } from "@/components/Seo";
import { CampaignTable } from "@/features/campaign/components/CampaignTable";
import { CreateCampaignDialog } from "@/features/campaign/components/CreateCampaignDialog";
import { useWorkspace } from "@/features/workspace/WorkspaceProvider";
import { trpc } from "@/lib/queryClient";

export default function CampaignsPage() {
  const { workspace } = useWorkspace();
  const createDialogControls = useOpenControls();

  const {
    data: campaignsData,
    isLoading,
    refetch,
  } = useQuery(
    trpc.campaigns.listCampaigns.queryOptions(
      {
        workspaceId: workspace?.id ?? "",
      },
      {
        enabled: !!workspace?.id,
      },
    ),
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col min-h-screen">
        <Seo title="Campaigns" />
        <div className="flex flex-col gap-6 p-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-12">Campaigns</h1>
            <Button onClick={createDialogControls.onOpen}>
              <PlusSignIcon className="size-4" />
              Create Campaign
            </Button>
          </div>

          <CampaignTable
            campaigns={campaignsData?.campaigns}
            isLoading={isLoading}
            onCampaignDeleted={refetch}
          />
        </div>
      </div>

      <CreateCampaignDialog
        isOpen={createDialogControls.isOpen}
        onClose={createDialogControls.onClose}
        onCampaignCreated={refetch}
      />
    </DashboardLayout>
  );
}
