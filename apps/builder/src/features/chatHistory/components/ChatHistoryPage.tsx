import { Seo } from "@/components/Seo";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { useWorkspace } from "@/features/workspace/WorkspaceProvider";
import { ChatHistoryTable } from "./ChatHistoryTable";

export const ChatHistoryPage = () => {
  const { workspace } = useWorkspace();

  return (
    <div className="flex overflow-hidden h-screen flex-col">
      <Seo title="Chat History" />
      <DashboardHeader />
      <div className="flex h-full w-full bg-gray-1">
        <div className="flex flex-col w-full h-full">
          <div className="flex items-center justify-between px-8 py-6">
            <h1 className="text-3xl font-bold">Chat History</h1>
          </div>
          {workspace && <ChatHistoryTable workspaceId={workspace.id} />}
        </div>
      </div>
    </div>
  );
};
