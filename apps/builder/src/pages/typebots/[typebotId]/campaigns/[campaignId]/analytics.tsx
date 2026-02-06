import { useRouter } from "next/router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Seo } from "@/components/Seo";
import { CampaignAnalyticsPage } from "@/features/campaign/components/CampaignAnalyticsPage";
import { useWorkspace } from "@/features/workspace/WorkspaceProvider";

export default function CampaignAnalytics() {
  const router = useRouter();
  const { workspace } = useWorkspace();
  const { campaignId } = router.query;

  if (!campaignId || !workspace?.id) {
    return null;
  }

  return (
    <DashboardLayout>
      <Seo title="Campaign Analytics" />
      <CampaignAnalyticsPage
        workspaceId={workspace.id}
        campaignId={campaignId as string}
      />
    </DashboardLayout>
  );
}
