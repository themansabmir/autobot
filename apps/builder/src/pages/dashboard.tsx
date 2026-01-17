import { useTranslate } from "@tolgee/react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Seo } from "@/components/Seo";
import { useWorkspace } from "@/features/workspace/WorkspaceProvider";

export default function DashboardPage() {
  const { t } = useTranslate();
  const { workspace } = useWorkspace();

  return (
    <DashboardLayout>
      <div className="flex flex-col min-h-screen">
        <Seo title={workspace?.name ?? t("dashboard.title")} />
        <div className="flex flex-col gap-6 p-8">
          <h1 className="text-2xl font-semibold text-gray-12">Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-lg border border-gray-6 bg-gray-2">
              <h3 className="text-sm font-medium text-gray-11 mb-2">
                Total Typebots
              </h3>
              <p className="text-3xl font-bold text-gray-12">-</p>
            </div>
            <div className="p-6 rounded-lg border border-gray-6 bg-gray-2">
              <h3 className="text-sm font-medium text-gray-11 mb-2">
                Active Campaigns
              </h3>
              <p className="text-3xl font-bold text-gray-12">-</p>
            </div>
            <div className="p-6 rounded-lg border border-gray-6 bg-gray-2">
              <h3 className="text-sm font-medium text-gray-11 mb-2">
                Total Users
              </h3>
              <p className="text-3xl font-bold text-gray-12">-</p>
            </div>
          </div>
          <div className="p-6 rounded-lg border border-gray-6 bg-gray-2">
            <h2 className="text-lg font-semibold text-gray-12 mb-4">
              Welcome to your Dashboard
            </h2>
            <p className="text-gray-11">
              This is your central hub for managing typebots, campaigns, and
              users. Use the sidebar navigation to explore different sections.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
