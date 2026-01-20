import { buttonVariants } from "@typebot.io/ui/components/Button";
import { Upload01Icon } from "@typebot.io/ui/icons/Upload01Icon";
import { type ChangeEvent, useId, useState } from "react";
import { toast } from "@/lib/toast";

type Props = {
  workspaceId: string;
  onFileUploaded: (url: string) => void;
  disabled?: boolean;
};

export const CampaignFileUpload = ({
  workspaceId,
  onFileUploaded,
  disabled,
}: Props) => {
  const id = useId();
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string>();

  const handleInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target?.files) return;
    setIsUploading(true);

    const selectedFile = e.target.files[0] as File | undefined;
    if (!selectedFile) {
      setIsUploading(false);
      return toast({
        description: "Could not read file.",
      });
    }

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("workspaceId", workspaceId);

      const response = await fetch("/api/campaigns/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const data = await response.json();
      onFileUploaded(data.fileUrl);
      setFileName(data.fileName || selectedFile.name);
    } catch (error) {
      toast({
        description:
          error instanceof Error ? error.message : "Failed to upload file",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        type="file"
        id={`campaign-file-${id}`}
        className="hidden"
        onChange={handleInputChange}
        accept=".csv,.xlsx,.xls"
        disabled={disabled || isUploading}
      />
      <label
        htmlFor={`campaign-file-${id}`}
        className={buttonVariants({
          variant: "secondary",
          size: "default",
        })}
        data-disabled={isUploading || disabled}
        style={{
          cursor: isUploading || disabled ? "not-allowed" : "pointer",
          opacity: isUploading || disabled ? 0.5 : 1,
        }}
      >
        <Upload01Icon className="size-4 mr-2" />
        {isUploading ? "Uploading..." : "Upload CSV/Excel File"}
      </label>
      {fileName && (
        <p className="text-xs text-green-11 flex items-center gap-1">
          ✓ {fileName}
        </p>
      )}
    </div>
  );
};
