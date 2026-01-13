import { trpc } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@typebot.io/ui/components/Button";
import { LoaderCircleIcon } from "@typebot.io/ui/icons/LoaderCircleIcon";
import { BasicSelect } from "@/components/inputs/BasicSelect";
import { ChatSessionDetailDialog } from "./ChatSessionDetailDialog";

type Props = {
  workspaceId: string;
};

export const ChatHistoryTable = ({ workspaceId }: Props) => {
  const [selectedTypebotId, setSelectedTypebotId] = useState<
    string | undefined
  >();
  const [selectedSessionId, setSelectedSessionId] = useState<
    string | undefined
  >();
  const [cursor, setCursor] = useState<string | undefined>();

  const { data: typebotsData } = useQuery(
    trpc.typebot.listTypebots.queryOptions({
      workspaceId,
    }),
  );

  const {
    data: chatSessionsData,
    isLoading,
    refetch,
  } = useQuery(
    trpc.chatHistory.getChatSessions.queryOptions({
      workspaceId,
      typebotId: selectedTypebotId,
      limit: 50,
      cursor,
    }),
  );

  const typebots = typebotsData?.typebots || [];
  const chatSessions = chatSessionsData?.chatSessions || [];

  const handleTypebotFilterChange = (value: string) => {
    setSelectedTypebotId(value === "all" ? undefined : value);
    setCursor(undefined);
  };

  const handleRowClick = (sessionId: string) => {
    setSelectedSessionId(sessionId);
  };

  const handleCloseDialog = () => {
    setSelectedSessionId(undefined);
  };

  const handleLoadMore = () => {
    if (chatSessionsData?.nextCursor) {
      setCursor(chatSessionsData.nextCursor);
      refetch();
    }
  };

  return (
    <div className="flex flex-col w-full h-full px-8 pb-8">
      <div className="mb-4 flex items-center gap-4">
        <label className="text-sm font-medium">Filter by Typebot:</label>
        <BasicSelect
          value={selectedTypebotId || "all"}
          onChange={handleTypebotFilterChange}
          items={[
            { label: "All Typebots", value: "all" },
            ...typebots.map((typebot) => ({
              label: typebot.name,
              value: typebot.id,
            })),
          ]}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <LoaderCircleIcon className="animate-spin" />
        </div>
      ) : chatSessions.length === 0 ? (
        <div className="flex justify-center items-center h-64 text-gray-500">
          No chat sessions found
        </div>
      ) : (
        <>
          <div className="overflow-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Session ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Typebot
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {chatSessions.map((session) => (
                  <tr
                    key={session.id}
                    onClick={() => handleRowClick(session.id)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {session.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {session.typebotName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(session.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(session.updatedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {chatSessionsData?.nextCursor && (
            <div className="mt-4 flex justify-center">
              <Button onClick={handleLoadMore} variant="outline">
                Load More
              </Button>
            </div>
          )}
        </>
      )}

      {selectedSessionId && (
        <ChatSessionDetailDialog
          sessionId={selectedSessionId}
          workspaceId={workspaceId}
          onClose={handleCloseDialog}
        />
      )}
    </div>
  );
};
