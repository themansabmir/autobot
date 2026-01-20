import { useTranslate } from "@tolgee/react";
import { Seo } from "@/components/Seo";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useWorkspace } from "@/features/workspace/WorkspaceProvider";
import { MoreHorizontalIcon } from "@typebot.io/ui/icons/MoreHorizontalIcon";
import { Edit03Icon } from "@typebot.io/ui/icons/Edit03Icon";

// Mock Data for UI Matching
const recentProjects = [
  { name: "Compliance Assistant v4", status: "LIVE", lastModified: "Oct 24, 2023", owner: "Sarah Jenkins", interactions: "12,402", statusColor: "bg-green-500/10 text-green-500" },
  { name: "Internal HR FAQ Bot", status: "UNDER REVIEW", lastModified: "Oct 22, 2023", owner: "Mike Ross", interactions: "--", statusColor: "bg-yellow-500/10 text-yellow-500" },
  { name: "Tax Advisory Support Alpha", status: "DRAFT", lastModified: "Oct 20, 2023", owner: "Rachel Zane", interactions: "--", statusColor: "bg-gray-500/10 text-gray-400" },
  { name: "EY Global Onboarding Bot", status: "LIVE", lastModified: "Oct 18, 2023", owner: "Harvey Specter", interactions: "84,103", statusColor: "bg-green-500/10 text-green-500" },
];

export default function DashboardPage() {
  const { t } = useTranslate();
  const { workspace } = useWorkspace();

  return (
    <DashboardLayout>
      <div className="flex flex-col min-h-screen font-sans">
        <Seo title={workspace?.name ?? t("dashboard.title")} />

        <div className="flex flex-col gap-8 max-w-[1400px] mx-auto w-full">

          {/* Stats Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Total Engagements */}
            <div className="p-6 rounded-sm bg-white dark:bg-[#252525] border border-gray-200 dark:border-[#333] relative overflow-hidden group hover:border-gray-300 dark:hover:border-[#444] shadow-sm transition-colors">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase">Total Engagements</h3>
                <span className="text-xs font-medium text-green-600 dark:text-green-500 bg-green-100 dark:bg-green-500/10 px-2 py-0.5 rounded">~ 12%</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">142,802</span>
                <span className="text-sm text-gray-500">chats</span>
              </div>
              <div className="mt-4 h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-[#FFE600] w-[45%]" />
              </div>
            </div>

            {/* Card 2: Active Bots */}
            <div className="p-6 rounded-sm bg-white dark:bg-[#252525] border border-gray-200 dark:border-[#333] group hover:border-gray-300 dark:hover:border-[#444] shadow-sm transition-colors">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase">Active Bots</h3>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/30 px-2 py-0.5 rounded">Steady</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">48</span>
                <span className="text-sm text-gray-500">live</span>
              </div>
              <div className="mt-4 h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-[#FFE600] w-[25%]" />
              </div>
            </div>

            {/* Card 3: Completion Rate */}
            <div className="p-6 rounded-sm bg-white dark:bg-[#252525] border border-gray-200 dark:border-[#333] group hover:border-gray-300 dark:hover:border-[#444] shadow-sm transition-colors">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase">Completion Rate</h3>
                <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-400/10 px-2 py-0.5 rounded">↘ 3%</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">84.2%</span>
                <span className="text-sm text-gray-500">avg</span>
              </div>
              <div className="mt-4 h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-[#FFE600] w-[84%]" />
              </div>
            </div>
          </div>

          {/* Recent Projects Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-4 bg-white dark:bg-[#252525] rounded-t-sm border border-gray-200 dark:border-[#333] border-b-0">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Projects</h2>
              <button className="text-xs font-bold text-[#FFE600] hover:text-yellow-600 dark:hover:text-yellow-300 flex items-center gap-1">
                View All Projects
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </button>
            </div>

            <div className="overflow-x-auto bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#333] rounded-b-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-[#333] bg-gray-50 dark:bg-[#1F1F1F]">
                    <th className="py-3 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Project Name</th>
                    <th className="py-3 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="py-3 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Last Modified</th>
                    <th className="py-3 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Owner</th>
                    <th className="py-3 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Interactions</th>
                    <th className="py-3 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-[#333]">
                  {recentProjects.map((project, idx) => (
                    <tr key={idx} className="group hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors">
                      <td className="py-4 px-6 text-sm font-medium text-gray-900 dark:text-white">{project.name}</td>
                      <td className="py-4 px-6">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wide ${project.statusColor}`}>
                          {project.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-500 dark:text-gray-400">{project.lastModified}</td>
                      <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">{project.owner}</td>
                      <td className="py-4 px-6 text-sm text-gray-900 dark:text-white font-mono">{project.interactions}</td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2 text-gray-400 dark:text-gray-500">
                          <button className="hover:text-gray-900 dark:hover:text-white p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                            <Edit03Icon className="w-4 h-4" />
                          </button>
                          <button className="hover:text-gray-900 dark:hover:text-white p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                            <MoreHorizontalIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
