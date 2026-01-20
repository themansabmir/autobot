import { useTranslate } from "@tolgee/react";
import { Button, type ButtonProps } from "@typebot.io/ui/components/Button";
import { PlusSignIcon } from "@typebot.io/ui/icons/PlusSignIcon";
import { cn } from "@typebot.io/ui/lib/cn";
import { useRouter } from "next/router";
import { stringify } from "qs";
import { useTypebotDnd } from "../TypebotDndProvider";

export const CreateBotButton = ({
  folderId,
  ...props
}: { folderId?: string } & ButtonProps) => {
  const { t } = useTranslate();
  const router = useRouter();
  const { draggedTypebot } = useTypebotDnd();

  const handleClick = () =>
    router.push(
      `/typebots/create?${stringify({
        folderId,
      })}`,
    );

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      className={cn(
        "flex-col w-full h-[270px] rounded-xl whitespace-normal bg-white dark:bg-[#1A1A1A] border-gray-300 dark:border-gray-800 border-dashed hover:border-[#FFE600] hover:bg-white dark:hover:bg-[#1A1A1A] transition-all group",
        draggedTypebot && "opacity-30",
      )}
      {...props}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center justify-center size-16 rounded-full border border-[#FFE600]/50 text-[#FFE600] dark:text-[#FFE600] group-hover:bg-[#FFE600] group-hover:text-black dark:group-hover:text-black transition-all">
          <PlusSignIcon className="size-8" />
        </div>
        <p className="font-semibold text-lg text-gray-900 dark:text-white">
          Create a typebot
        </p>
      </div>
    </Button>
  );
};
