import { useMutation } from "@tanstack/react-query";
import { T, useTranslate } from "@tolgee/react";
import { Alert } from "@typebot.io/ui/components/Alert";
import { Badge } from "@typebot.io/ui/components/Badge";
import { Button, buttonVariants } from "@typebot.io/ui/components/Button";
import { Menu } from "@typebot.io/ui/components/Menu";
import { useOpenControls } from "@typebot.io/ui/hooks/useOpenControls";
import { DragDropHorizontalIcon } from "@typebot.io/ui/icons/DragDropHorizontalIcon";
import { LayoutBottomIcon } from "@typebot.io/ui/icons/LayoutBottomIcon";
import { MoreVerticalIcon } from "@typebot.io/ui/icons/MoreVerticalIcon";
import { TriangleAlertIcon } from "@typebot.io/ui/icons/TriangleAlertIcon";
import { cn } from "@typebot.io/ui/lib/cn";
import { useRouter } from "next/router";
import React, { memo } from "react";
import { useDebounce } from "use-debounce";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmojiOrImageIcon } from "@/components/EmojiOrImageIcon";
import type { TypebotInDashboard } from "@/features/dashboard/types";
import {
  type NodePosition,
  useDragDistance,
} from "@/features/graph/providers/GraphDndProvider";
import { duplicateName } from "@/features/typebot/helpers/duplicateName";
import { isMobile } from "@/helpers/isMobile";
import { trpc, trpcClient } from "@/lib/queryClient";

type Props = {
  typebot: TypebotInDashboard;
  isReadOnly?: boolean;
  draggedTypebot: TypebotInDashboard | undefined;
  onTypebotUpdated: () => void;
  onDrag: (position: NodePosition) => void;
};

const TypebotButton = ({
  typebot,
  isReadOnly = false,
  draggedTypebot,
  onTypebotUpdated,
  onDrag,
}: Props) => {
  const { t } = useTranslate();
  const router = useRouter();
  const [draggedTypebotDebounced] = useDebounce(draggedTypebot, 200);
  const deleteDialogControls = useOpenControls();
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  useDragDistance({
    ref: buttonRef,
    onDrag,
    deps: [],
  });

  const { mutate: importTypebot } = useMutation(
    trpc.typebot.importTypebot.mutationOptions({
      onSuccess: ({ typebot }) => {
        router.push(`/typebots/${typebot.id}/edit`);
      },
    }),
  );

  const { mutate: deleteTypebot } = useMutation(
    trpc.typebot.deleteTypebot.mutationOptions({
      onSuccess: () => {
        onTypebotUpdated();
      },
    }),
  );

  const { mutate: unpublishTypebot } = useMutation(
    trpc.typebot.unpublishTypebot.mutationOptions({
      onSuccess: () => {
        onTypebotUpdated();
      },
    }),
  );

  const handleTypebotClick = () => {
    if (draggedTypebotDebounced) return;
    router.push(
      isMobile
        ? `/typebots/${typebot.id}/results`
        : `/typebots/${typebot.id}/edit`,
    );
  };

  const handleDeleteTypebotClick = async () => {
    if (isReadOnly) return;
    deleteTypebot({
      typebotId: typebot.id,
    });
  };

  const handleDuplicateClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const { typebot: typebotToDuplicate } =
      await trpcClient.typebot.getTypebot.query({
        typebotId: typebot.id,
      });
    if (!typebotToDuplicate) return;
    importTypebot({
      workspaceId: typebotToDuplicate.workspaceId,
      typebot: {
        ...typebotToDuplicate,
        name: duplicateName(typebotToDuplicate.name),
      },
    });
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteDialogControls.onOpen();
  };

  const handleUnpublishClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!typebot.publishedTypebotId) return;
    unpublishTypebot({ typebotId: typebot.id });
  };

  return (
    <>
      <div
        role="button"
        onClick={handleTypebotClick}
        className={cn(
          buttonVariants({
            variant: "outline-secondary",
            iconStyle: "none",
            size: "lg",
          }),
          "flex-col w-full h-[270px] rounded-xl whitespace-normal bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 hover:border-yellow-400/50 hover:shadow-lg transition-all group relative",
          draggedTypebot && "opacity-30",
        )}
      >
        {typebot.publishedTypebotId && (
          <Badge colorScheme="orange" className="absolute top-[27px]">
            {t("folders.typebotButton.live")}
          </Badge>
        )}
        {!isReadOnly && (
          <>
            <Button
              ref={buttonRef}
              className="absolute top-5 left-5 size-8 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Drag"
              variant="ghost"
              size="icon"
            >
              <DragDropHorizontalIcon />
            </Button>
            <Menu.Root>
              <Menu.TriggerButton
                aria-label={t("folders.typebotButton.showMoreOptions")}
                data-testid="more-button"
                onClick={(e) => e.stopPropagation()}
                variant="ghost"
                size="icon"
                className="absolute top-5 right-5 size-8 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
              >
                <MoreVerticalIcon />
              </Menu.TriggerButton>
              <Menu.Popup align="end">
                {typebot.publishedTypebotId && (
                  <Menu.Item onClick={handleUnpublishClick}>
                    {t("folders.typebotButton.unpublish")}
                  </Menu.Item>
                )}
                <Menu.Item onClick={handleDuplicateClick}>
                  {t("folders.typebotButton.duplicate")}
                </Menu.Item>
                <Menu.Item className="text-red-10" onClick={handleDeleteClick}>
                  {t("delete")}
                </Menu.Item>
              </Menu.Popup>
            </Menu.Root>
          </>
        )}
        <div className="flex flex-col items-center gap-6 mt-8">
          <div className="flex items-center justify-center size-20 rounded-2xl bg-gray-50 dark:bg-[#262626] border border-gray-200 dark:border-gray-700 shadow-inner">
            <EmojiOrImageIcon
              icon={typebot.icon}
              size="lg"
              defaultIcon={LayoutBottomIcon}
              className="[&_svg]:size-10 text-gray-500 dark:text-gray-300"
            />
          </div>
          <div className="flex flex-col items-center gap-1 px-4">
            <p className="text-center font-semibold text-lg text-gray-900 dark:text-white line-clamp-2 leading-tight">
              {typebot.name}
            </p>
            <span className="text-xs text-gray-500 font-medium">Edited 2h ago</span>
            {/* Mocking edited message as per screenshot or needing a prop if available */}
          </div>
        </div>
      </div>
      {!isReadOnly && (
        <ConfirmDialog
          confirmButtonLabel={t("delete")}
          onConfirm={handleDeleteTypebotClick}
          isOpen={deleteDialogControls.isOpen}
          onClose={deleteDialogControls.onClose}
        >
          <p>
            <T
              keyName="folders.typebotButton.deleteConfirmationMessage"
              params={{
                strong: <strong>{typebot.name}</strong>,
              }}
            />
          </p>
          <Alert.Root variant="warning">
            <TriangleAlertIcon />
            <Alert.Description>
              {t("folders.typebotButton.deleteConfirmationMessageWarning")}
            </Alert.Description>
          </Alert.Root>
        </ConfirmDialog>
      )}
    </>
  );
};

export default memo(
  TypebotButton,
  (prev, next) =>
    prev.draggedTypebot?.id === next.draggedTypebot?.id &&
    prev.typebot.id === next.typebot.id &&
    prev.isReadOnly === next.isReadOnly &&
    prev.typebot.name === next.typebot.name &&
    prev.typebot.icon === next.typebot.icon &&
    prev.typebot.publishedTypebotId === next.typebot.publishedTypebotId,
);
