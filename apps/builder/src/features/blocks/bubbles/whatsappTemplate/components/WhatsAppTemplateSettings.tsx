import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslate } from "@tolgee/react";
import type { WhatsAppTemplateBlock } from "@typebot.io/blocks-bubbles/whatsappTemplate/schema";
import { Field } from "@typebot.io/ui/components/Field";
import { trpc } from "@/lib/queryClient";
import { Button } from "@typebot.io/ui/components/Button";
import { Input } from "@typebot.io/ui/components/Input";
import { CredentialsDropdown } from "@/features/credentials/components/CredentialsDropdown";
import { useWorkspace } from "@/features/workspace/WorkspaceProvider";
import { useTypebot } from "@/features/editor/providers/TypebotProvider";
import { useOpenControls } from "@typebot.io/ui/hooks/useOpenControls";
import { WhatsAppCredentialsDialog } from "@/features/publish/components/deploy/dialogs/whatsApp/WhatsAppCredentialsDialog";
import { DebouncedTextInputWithVariablesButton } from "@/components/inputs/DebouncedTextInput";
import type { ParsedTemplate } from "@typebot.io/whatsapp/parseWhatsAppTemplate";

type Props = {
  block: WhatsAppTemplateBlock;
  onContentChange: (content: WhatsAppTemplateBlock["content"]) => void;
};

export const WhatsAppTemplateSettings = ({
  block,
  onContentChange,
}: Props) => {
  const { t } = useTranslate();
  const { workspace } = useWorkspace();
  const { typebot } = useTypebot();
  const { isOpen, onOpen, onClose } = useOpenControls();

  const credentialsId: string | undefined = (block.content?.credentialsId ??
    typebot?.whatsAppCredentialsId ??
    undefined) === null ? undefined : (block.content?.credentialsId ?? typebot?.whatsAppCredentialsId ?? undefined);

  const { data: templates, isFetching, error, refetch } = useQuery(
    trpc.whatsAppInternal.getTemplates.queryOptions(
      { 
        credentialsId: credentialsId as string,
        templateName: block.content?.templateName
      },
      { enabled: false }
    )
  );

  const selectedTemplate = block.content?.parsedTemplate;

  const handleTemplateNameChange = (templateName: string) => {
    onContentChange({
      ...(block.content ?? {}),
      templateName,
      parsedTemplate: undefined,
    });
  };

  const handleLanguageCodeChange = (languageCode: string) => {
    onContentChange({
      ...(block.content ?? {}),
      languageCode,
      parsedTemplate: undefined,
    });
  };

  const handleFetchTemplate = async () => {
    if (!credentialsId || !block.content?.templateName) return;
    const { data } = await refetch();
    const template = data?.find(
      (t: any) =>
        t.name === block.content?.templateName &&
        (!block.content?.languageCode || t.languageCode === block.content?.languageCode)
    );
    if (template) {
      onContentChange({
        ...(block.content ?? {}),
        templateName: template.name,
        languageCode: template.languageCode,
        variableMappings: {},
        parsedTemplate: template,
      });
    }
  };

  const handleVariableChange = (key: string, value: string) => {
    onContentChange({
      ...(block.content ?? {}),
      variableMappings: {
        ...block.content?.variableMappings,
        [key]: value,
      },
    });
  };

  const handleCredentialsChange = (credentialsId: string | undefined) => {
    onContentChange({
      ...(block.content ?? {}),
      credentialsId,
      templateName: undefined,
      languageCode: undefined,
      variableMappings: {},
      parsedTemplate: undefined,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Field.Root>
        <Field.Label>WhatsApp Account</Field.Label>
        {workspace && (
           <>
            <CredentialsDropdown
              type="whatsApp"
              scope={{ type: "workspace", workspaceId: workspace.id }}
              currentCredentialsId={credentialsId}
              onCredentialsSelect={handleCredentialsChange}
              onCreateNewClick={onOpen}
              credentialsName="WhatsApp account"
            />
            <WhatsAppCredentialsDialog
              isOpen={isOpen}
              onClose={onClose}
              onNewCredentials={handleCredentialsChange}
            />
           </>
        )}
      </Field.Root>

      {error && (
        <Alert variant="warning">
          Failed to fetch templates: {(error as any).message}
        </Alert>
      )}

      {credentialsId && (
        <div className="flex gap-2 items-end w-full">
          <Field.Root className="flex-1">
            <Field.Label>Template Name</Field.Label>
            <Input
              defaultValue={block.content?.templateName}
              onValueChange={handleTemplateNameChange}
              placeholder="e.g. hello_world"
            />
          </Field.Root>
          <Field.Root className="w-24">
            <Field.Label>Language</Field.Label>
            <Input
              defaultValue={block.content?.languageCode}
              onValueChange={handleLanguageCodeChange}
              placeholder="en_US"
            />
          </Field.Root>
          <Button
            variant="secondary"
            onClick={handleFetchTemplate}
            disabled={!block.content?.templateName || isFetching}
          >
            Fetch
          </Button>
        </div>
      )}

      {selectedTemplate && (
        <div className="flex flex-col gap-4 border p-4 rounded-md bg-gray-50 dark:bg-gray-800">
          <p className="font-semibold text-xs text-gray-500 uppercase">Preview</p>
          <div className="whitespace-pre-wrap text-sm italic">
            {selectedTemplate.components?.find((c: any) => c.type === 'BODY')?.text}
          </div>
        </div>
      )}

      {selectedTemplate && (
        <div className="flex flex-col gap-4 border-t pt-4">
          <p className="font-semibold text-sm">Variable Mapping</p>
          {selectedTemplate.components?.map((component: any, cIndex: number) => {
            if (component.type === "HEADER") {
                if (["IMAGE", "VIDEO", "DOCUMENT"].includes(component.format)) {
                    return (
                        <Field.Root key="HEADER_MEDIA">
                            <Field.Label>Header Media URL</Field.Label>
                            <DebouncedTextInputWithVariablesButton
                                defaultValue={block.content?.variableMappings?.["HEADER_MEDIA"] ?? ""}
                                onValueChange={(val: string) => handleVariableChange("HEADER_MEDIA", val)}
                                placeholder="https://..."
                            />
                        </Field.Root>
                    )
                }
                if (component.format === "TEXT" && component.variablesCount > 0) {
                    return Array.from({ length: component.variablesCount }).map((_, i: number) => (
                        <Field.Root key={`HEADER_${i + 1}`}>
                            <Field.Label>Header Variable {i + 1}</Field.Label>
                            <DebouncedTextInputWithVariablesButton
                                defaultValue={block.content?.variableMappings?.[`HEADER_${i+1}`] ?? ""}
                                onValueChange={(val: string) => handleVariableChange(`HEADER_${i+1}`, val)}
                            />
                        </Field.Root>
                    ))
                }
            }
            if (component.type === "BODY" && component.variablesCount > 0) {
                 return Array.from({ length: component.variablesCount }).map((_, i: number) => (
                        <Field.Root key={`BODY_${i + 1}`}>
                            <Field.Label>Body Variable {i + 1}</Field.Label>
                            <DebouncedTextInputWithVariablesButton
                                defaultValue={block.content?.variableMappings?.[`BODY_${i+1}`] ?? ""}
                                onValueChange={(val: string) => handleVariableChange(`BODY_${i+1}`, val)}
                            />
                        </Field.Root>
                 ))
            }
            if (component.type === "BUTTONS") {
                return component.buttons?.map((button: any, bIndex: number) => {
                    if (button.type === "URL" && button.hasVariable) {
                        return (
                             <Field.Root key={`BUTTON_${bIndex}_1`}>
                                 <Field.Label>Button {bIndex + 1} URL Variable</Field.Label>
                                <DebouncedTextInputWithVariablesButton
                                    defaultValue={block.content?.variableMappings?.[`BUTTON_${bIndex}_1`] ?? ""}
                                    onValueChange={(val: string) => handleVariableChange(`BUTTON_${bIndex}_1`, val)}
                                />
                            </Field.Root>
                        )
                    }
                    return null;
                })
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
};

const Alert = ({ children, variant }: { children: React.ReactNode; variant: "warning" }) => (
    <div className="p-3 bg-orange-100 text-orange-800 rounded-md text-sm border border-orange-200">
        {children}
    </div>
)
