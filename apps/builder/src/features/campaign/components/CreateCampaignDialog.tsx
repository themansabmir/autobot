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
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@typebot.io/ui/lib/cn";
import { TickIcon } from "@typebot.io/ui/icons/TickIcon";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCampaignCreated: () => void;
};

const steps = [
  {
    id: 1,
    title: "Campaign details",
    description: "Name your campaign and choose a typebot",
  },
  {
    id: 2,
    title: "Audience",
    description: "Upload and review your contact list",
  },
  {
    id: 3,
    title: "Schedule",
    description: "Decide whether to send now or later",
  },
];

export const CreateCampaignDialog = ({
  isOpen,
  onClose,
  onCampaignCreated,
}: Props) => {
  const { workspace } = useWorkspace();
  const [title, setTitle] = useState("");
  const [typebotId, setTypebotId] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [executionMode, setExecutionMode] = useState<"NOW" | "SCHEDULED" | null>(null);
  const [executeAt, setExecuteAt] = useState("");
  const [currentStep, setCurrentStep] = useState(1);

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
    setExecutionMode(null);
    setExecuteAt("");
    setCurrentStep(1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentStep === 1) {
      if (title && typebotId) setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      if (fileUrl) setCurrentStep(3);
      return;
    }

    if (!workspace?.id || !title || !typebotId || !fileUrl || !executionMode) return;

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
      <Dialog.Popup className="max-w-5xl p-0 overflow-hidden">
        <div className="flex flex-col md:flex-row h-[600px]">
          {/* Sidebar Stepper */}
          <div className="w-full md:w-1/3 bg-gray-50 dark:bg-gray-900 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 p-6 flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Create Campaign
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Launch a targeted message in just a few guided steps.
              </p>
            </div>
            
            <div className="flex flex-col gap-2 relative">
              {/* Vertical connector line */}
              <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-gray-200 dark:bg-gray-800 -z-10" />
              
              {steps.map((step, index) => {
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                
                return (
                  <div
                    key={step.id}
                    className={cn(
                      "flex items-start gap-4 p-2 rounded-lg transition-colors",
                      isActive ? "bg-white dark:bg-gray-800 shadow-sm" : ""
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-medium border-2 transition-colors z-10 bg-gray-50 dark:bg-gray-900",
                        isActive
                          ? "border-[#FFE600] bg-[#FFE600] text-black"
                          : isCompleted
                          ? "border-green-500 bg-green-500 text-white"
                          : "border-gray-200 dark:border-gray-700 text-gray-400"
                      )}
                    >
                      {isCompleted ? <TickIcon className="w-4 h-4" /> : step.id}
                    </div>
                    <div className="flex flex-col pt-1">
                      <span
                        className={cn(
                          "text-sm font-medium leading-none mb-1",
                          isActive
                            ? "text-gray-900 dark:text-white"
                            : "text-gray-500"
                        )}
                      >
                        {step.title}
                      </span>
                      <span className="text-xs text-gray-400 leading-tight">
                        {step.description}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#1A1A1A]">
            <div className="flex-1 p-8 overflow-y-auto">
              <form id="campaign-form" onSubmit={handleSubmit} className="h-full flex flex-col">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-6 flex-1"
                  >
                    {currentStep === 1 && (
                      <>
                        <div className="space-y-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Campaign details
                          </h3>
                          <p className="text-sm text-gray-500">
                            Basic information about your campaign.
                          </p>
                        </div>

                        <div className="space-y-4 max-w-lg">
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="title">Campaign Name</Label>
                            <Input
                              id="title"
                              placeholder="e.g. Q4 Customer Outreach"
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              autoFocus
                            />
                            <p className="text-xs text-gray-400">
                              Use a descriptive name to easily identify this campaign later.
                            </p>
                          </div>

                          <div className="flex flex-col gap-2">
                            <Label htmlFor="typebot">Select Typebot</Label>
                            <Select.Root value={typebotId} onValueChange={setTypebotId}>
                              <Select.Trigger id="typebot" className="w-full">
                                {typebotId
                                  ? publishedTypebots?.find((t) => t.id === typebotId)?.name
                                  : "Search for a published typebot..."}
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
                          </div>
                        </div>
                      </>
                    )}

                    {currentStep === 2 && (
                      <>
                        <div className="space-y-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Audience
                          </h3>
                          <p className="text-sm text-gray-500">
                            Upload your audience list to start the campaign.
                          </p>
                        </div>

                        <div className="flex flex-col gap-6 max-w-2xl">
                          <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-gray-50/50 dark:bg-gray-800/20">
                             <CampaignFileUpload
                                workspaceId={workspace?.id ?? ""}
                                onFileUploaded={setFileUrl}
                                disabled={!workspace?.id}
                              />
                          </div>

                          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-lg p-4">
                            <h4 className="flex items-center gap-2 text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                              <span className="text-lg">💡</span> Tips for a clean contact list
                            </h4>
                            <ul className="list-disc pl-10 space-y-1 text-sm text-blue-700 dark:text-blue-400">
                              <li>Use international phone format (e.g., +1 234 567 890).</li>
                              <li>Include optional columns such as <strong>first_name</strong> to personalize messages.</li>
                              <li>Ensure you have explicit consent to message these contacts.</li>
                            </ul>
                          </div>
                        </div>
                      </>
                    )}

                    {currentStep === 3 && (
                      <>
                         <div className="space-y-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Schedule
                          </h3>
                          <p className="text-sm text-gray-500">
                            Review and decide when to send your campaign.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                              <h4 className="font-medium text-gray-900 dark:text-white">Summary</h4>
                              <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Campaign Name</span>
                                  <span className="font-medium">{title}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Typebot</span>
                                  <span className="font-medium">
                                    {publishedTypebots?.find((t) => t.id === typebotId)?.name}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Recipients</span>
                                  <span className="font-medium text-green-600 flex items-center gap-1">
                                    <TickIcon className="w-3 h-3" /> File uploaded
                                  </span>
                                </div>
                              </div>
                           </div>

                           <div className="space-y-4">
                              <Label>Execution Timing</Label>
                              <div className="grid grid-cols-1 gap-3">
                                <label
                                  className={cn(
                                    "flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all",
                                    executionMode === "NOW"
                                      ? "border-[#FFE600] bg-[#FFE600]/10 ring-1 ring-[#FFE600]"
                                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                                  )}
                                >
                                  <input
                                    type="radio"
                                    name="executionMode"
                                    value="NOW"
                                    checked={executionMode === "NOW"}
                                    onChange={() => setExecutionMode("NOW")}
                                    className="accent-[#FFE600] w-4 h-4"
                                  />
                                  <div className="flex flex-col">
                                    <span className="font-medium text-sm">Send Immediately</span>
                                    <span className="text-xs text-gray-500">Start sending messages right now</span>
                                  </div>
                                </label>
                                
                                <label
                                  className={cn(
                                    "flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all",
                                    executionMode === "SCHEDULED"
                                      ? "border-[#FFE600] bg-[#FFE600]/10 ring-1 ring-[#FFE600]"
                                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                                  )}
                                >
                                  <input
                                    type="radio"
                                    name="executionMode"
                                    value="SCHEDULED"
                                    checked={executionMode === "SCHEDULED"}
                                    onChange={() => setExecutionMode("SCHEDULED")}
                                    className="accent-[#FFE600] w-4 h-4"
                                  />
                                  <div className="flex flex-col">
                                    <span className="font-medium text-sm">Schedule for Later</span>
                                    <span className="text-xs text-gray-500">Pick a specific date and time</span>
                                  </div>
                                </label>
                              </div>

                              {executionMode === "SCHEDULED" && (
                                <div className="animate-fade-in pt-2">
                                  <Label htmlFor="executeAt">Date & Time</Label>
                                  <Input
                                    id="executeAt"
                                    type="datetime-local"
                                    value={executeAt}
                                    onChange={(e) => setExecuteAt(e.target.value)}
                                    min={new Date().toISOString().slice(0, 16)}
                                    required={executionMode === "SCHEDULED"}
                                    className="mt-1"
                                  />
                                </div>
                              )}
                           </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Footer Buttons */}
                <div className="flex justify-between items-center pt-6 mt-auto border-t border-gray-100 dark:border-gray-800">
                   <div className="text-sm text-gray-500">
                      Step {currentStep} of 3
                   </div>
                   <div className="flex gap-3">
                      {currentStep > 1 ? (
                        <Button type="button" variant="secondary" onClick={() => setCurrentStep((s) => s - 1)}>
                          Back
                        </Button>
                      ) : (
                        <Button type="button" variant="ghost" onClick={handleClose}>
                          Cancel
                        </Button>
                      )}

                      {currentStep < 3 ? (
                        <Button
                          type="button"
                          className="bg-[#FFE600] hover:bg-[#E6CF00] text-black font-semibold"
                          onClick={() => setCurrentStep((s) => s + 1)}
                          disabled={
                            (currentStep === 1 && (!title || !typebotId)) ||
                            (currentStep === 2 && !fileUrl)
                          }
                        >
                          Continue
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          className="bg-[#FFE600] hover:bg-[#E6CF00] text-black font-semibold"
                          disabled={
                            isPending ||
                            !executionMode ||
                            (executionMode === "SCHEDULED" && !executeAt)
                          }
                        >
                          {isPending ? "Creating..." : "Create Campaign"}
                        </Button>
                      )}
                   </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Dialog.Popup>
    </Dialog.Root>
  );
};
