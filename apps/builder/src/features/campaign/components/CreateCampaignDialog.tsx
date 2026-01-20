import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@typebot.io/ui/components/Button";
import { Dialog } from "@typebot.io/ui/components/Dialog";
import { Input } from "@typebot.io/ui/components/Input";
import { Label } from "@typebot.io/ui/components/Label";
import { Select } from "@typebot.io/ui/components/Select";
import { useState } from "react";
import { useWorkspace } from "@/features/workspace/WorkspaceProvider";
import { trpc } from "@/lib/queryClient";
import { CampaignFileUpload } from "./CampaignFileUpload";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCampaignCreated: () => void;
};

export const CreateCampaignDialog = ({
  isOpen,
  onClose,
  onCampaignCreated,
}: Props) => {
  const { workspace } = useWorkspace();
  const [title, setTitle] = useState("");
  const [typebotId, setTypebotId] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [executionMode, setExecutionMode] = useState<"NOW" | "SCHEDULED">(
    "NOW",
  );
  const [executeAt, setExecuteAt] = useState("");

  const { data: typebotsData, isLoading: isLoadingTypebots } = useQuery(
    trpc.typebot.listTypebots.queryOptions(
      {
        workspaceId: workspace?.id ?? "",
      },
      {
        enabled: !!workspace?.id && isOpen,
      },
    ),
  );

  const publishedTypebots = typebotsData?.typebots.filter(
    (t) => t.publishedTypebotId !== null,
  );

  const { mutate: createCampaign, isPending } = useMutation(
    trpc.campaigns.createCampaign.mutationOptions({
      onSuccess: () => {
        resetForm();
        onCampaignCreated();
        onClose();
      },
    }),
  );

  const resetForm = () => {
    setTitle("");
    setTypebotId("");
    setFileUrl("");
    setExecutionMode("NOW");
    setExecuteAt("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace?.id || !title || !typebotId || !fileUrl) return;

    createCampaign({
      workspaceId: workspace.id,
      title,
      typebotId,
      fileUrl,
      executionMode,
      executeAt:
        executionMode === "SCHEDULED" && executeAt
          ? new Date(executeAt).toISOString()
          : undefined,
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog.Root isOpen={isOpen} onClose={handleClose}>
      <Dialog.Popup className="max-w-lg">
        <Dialog.CloseButton />
        <Dialog.Title>Create Campaign</Dialog.Title>
        <p className="text-gray-11 text-sm">
          Create a new WhatsApp campaign to send messages to your contacts.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Campaign Title</Label>
            <Input
              id="title"
              placeholder="Enter campaign title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="typebot">Select Typebot</Label>
            <Select.Root value={typebotId} onValueChange={setTypebotId}>
              <Select.Trigger id="typebot" className="w-full">
                {typebotId
                  ? publishedTypebots?.find((t) => t.id === typebotId)?.name
                  : "Select a published typebot"}
              </Select.Trigger>
              <Select.Popup>
                {isLoadingTypebots ? (
                  <Select.Item value="loading" disabled>
                    Loading...
                  </Select.Item>
                ) : publishedTypebots && publishedTypebots.length > 0 ? (
                  publishedTypebots.map((typebot) => (
                    <Select.Item key={typebot.id} value={typebot.id}>
                      {typebot.name}
                    </Select.Item>
                  ))
                ) : (
                  <Select.Item value="none" disabled>
                    No published typebots found
                  </Select.Item>
                )}
              </Select.Popup>
            </Select.Root>
            <p className="text-xs text-gray-11">
              Only published typebots are shown
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Recipients File</Label>
            <CampaignFileUpload
              workspaceId={workspace?.id ?? ""}
              onFileUploaded={setFileUrl}
              disabled={!workspace?.id}
            />
            <p className="text-xs text-gray-11">
              Upload a CSV or Excel file with phone numbers
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Execution Mode</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="executionMode"
                  value="NOW"
                  checked={executionMode === "NOW"}
                  onChange={() => setExecutionMode("NOW")}
                  className="accent-orange-9"
                />
                <span className="text-sm">Send Now</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="executionMode"
                  value="SCHEDULED"
                  checked={executionMode === "SCHEDULED"}
                  onChange={() => setExecutionMode("SCHEDULED")}
                  className="accent-orange-9"
                />
                <span className="text-sm">Schedule for Later</span>
              </label>
            </div>
          </div>

          {executionMode === "SCHEDULED" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="executeAt">Schedule Date & Time</Label>
              <Input
                id="executeAt"
                type="datetime-local"
                value={executeAt}
                onChange={(e) => setExecuteAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                required={executionMode === "SCHEDULED"}
              />
            </div>
          )}

          <Dialog.Footer>
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title || !typebotId || !fileUrl || isPending}
              // isLoading={isPending}
            >
              Create Campaign
            </Button>
          </Dialog.Footer>
        </form>
      </Dialog.Popup>
    </Dialog.Root>
  );
};
