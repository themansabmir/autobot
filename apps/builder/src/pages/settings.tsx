import { DashboardLayout } from "@/components/DashboardLayout";
import { Seo } from "@/components/Seo";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col min-h-screen">
        <Seo title="Settings" />
        <div className="flex flex-col gap-6 p-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-12">Settings</h1>
          </div>
          <div className="p-6 rounded-lg border border-gray-6 bg-gray-2">
            <p className="text-gray-11">
              Settings page coming soon. You will be able to configure your
              workspace settings here.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
