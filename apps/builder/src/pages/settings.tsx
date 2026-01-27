
import { DashboardLayout } from "@/components/DashboardLayout";
import { Seo } from "@/components/Seo";
import { WorkspaceSettingsForm } from "@/features/workspace/components/WorkspaceSettingsForm";
import { MyAccountForm } from "@/features/user/components/MyAccountForm";
import { useTranslate } from "@tolgee/react";

export default function SettingsPage() {
  const { t } = useTranslate();

  return (
    <DashboardLayout>
      <div className="flex flex-col min-h-screen">
        <Seo title={t("settings.title")} />
        <div className="flex flex-col gap-10 p-8 max-w-4xl mx-auto w-full">
          <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {t("settings.workspace.title")}
            </h1>
            <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <WorkspaceSettingsForm onClose={() => {}} />
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {t("settings.account.title")}
            </h1>
            <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <MyAccountForm />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
