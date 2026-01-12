import { trpc } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Dialog } from "@typebot.io/ui/components/Dialog";
import { LoaderCircleIcon } from "@typebot.io/ui/icons/LoaderCircleIcon";

type Props = {
  sessionId: string;
  workspaceId: string;
  onClose: () => void;
};

export const ChatSessionDetailDialog = ({
  sessionId,
  workspaceId,
  onClose,
}: Props) => {
  const { data, isLoading } = useQuery(
    trpc.chatHistory.getChatSessionDetail.queryOptions({
      sessionId,
      workspaceId,
    }),
  );

  const session = data?.session;

  return (
    <Dialog.Root isOpen={true} onClose={onClose}>
      <Dialog.Popup className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <Dialog.Title>Chat Session Details</Dialog.Title>
        <Dialog.CloseButton />

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <LoaderCircleIcon className="animate-spin" />
          </div>
        ) : session ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-500">Session ID</p>
                <p className="text-sm text-gray-900">{session.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Typebot</p>
                <p className="text-sm text-gray-900">{session.typebotName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Created At</p>
                <p className="text-sm text-gray-900">
                  {new Date(session.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Last Updated
                </p>
                <p className="text-sm text-gray-900">
                  {new Date(session.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Chat Messages</h3>
              <div className="space-y-3">
                {session.messages.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No messages in this chat session
                  </p>
                ) : (
                  session.messages.map((message, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg ${
                        message.role === "user"
                          ? "bg-blue-50 ml-8"
                          : "bg-gray-50 mr-8"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs font-semibold uppercase ${
                            message.role === "user"
                              ? "text-blue-600"
                              : "text-gray-600"
                          }`}
                        >
                          {message.role}
                        </span>
                        {message.createdAt && (
                          <span className="text-xs text-gray-400">
                            {new Date(message.createdAt).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Session not found
          </div>
        )}
      </Dialog.Popup>
    </Dialog.Root>
  );
};
