import type { FilePathUploadProps } from "@/features/upload/api/generateUploadUrl";
import { useTranslate } from "@tolgee/react";
import { Button } from "@typebot.io/ui/components/Button";
import { useState } from "react";
import { DebouncedTextInputWithVariablesButton } from "../inputs/DebouncedTextInput";
import { UploadButton } from "./UploadButton";

type Tabs = "link" | "upload";

type Props = {
  uploadFileProps: FilePathUploadProps | undefined;
  defaultUrl?: string;
  fileType?: "image" | "audio" | "video" | "file";
  placeholder?: string;
  onSubmit: (url: string) => void;
  onClose?: () => void;
};

export const FileUploadContent = ({
  uploadFileProps,
  defaultUrl,
  fileType = "file",
  placeholder = "https://example.com/file.pdf or {{variableName}}",
  onSubmit,
  onClose,
}: Props) => {
  const [currentTab, setCurrentTab] = useState<Tabs>("link");

  const handleSubmit = (url: string) => {
    onSubmit(url);
    onClose && onClose();
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Button
          variant={currentTab === "link" ? "outline" : "ghost"}
          onClick={() => setCurrentTab("link")}
          size="sm"
        >
          Link
        </Button>
        <Button
          variant={currentTab === "upload" ? "outline" : "ghost"}
          onClick={() => setCurrentTab("upload")}
          size="sm"
        >
          Upload
        </Button>
      </div>
      <BodyContent
        uploadFileProps={uploadFileProps}
        tab={currentTab}
        onSubmit={handleSubmit}
        defaultUrl={defaultUrl}
        fileType={fileType}
        placeholder={placeholder}
      />
    </div>
  );
};

const BodyContent = ({
  uploadFileProps,
  tab,
  defaultUrl,
  fileType,
  placeholder,
  onSubmit,
}: {
  uploadFileProps?: FilePathUploadProps;
  tab: Tabs;
  defaultUrl?: string;
  fileType: "image" | "audio" | "video" | "file";
  placeholder?: string;
  onSubmit: (url: string) => void;
}) => {
  const { t } = useTranslate();

  switch (tab) {
    case "upload": {
      if (!uploadFileProps) return null;
      return (
        <div className="flex justify-center py-2">
          <UploadButton
            fileType={fileType}
            filePathProps={uploadFileProps}
            onFileUploaded={onSubmit}
          >
            {t("editor.header.uploadTab.uploadButton.label")}
          </UploadButton>
        </div>
      );
    }
    case "link":
      return (
        <DebouncedTextInputWithVariablesButton
          placeholder={placeholder}
          onValueChange={onSubmit}
          defaultValue={defaultUrl ?? ""}
        />
      );
  }
};
