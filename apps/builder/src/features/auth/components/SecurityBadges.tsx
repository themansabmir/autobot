import { LockIcon } from "@typebot.io/ui/icons/LockIcon";
import { ShieldCheckIcon } from "@typebot.io/ui/icons/ShieldCheckIcon";

export const SecurityBadges = () => {
  return (
    <div className="flex justify-center gap-12 text-[10px] text-gray-11 font-medium tracking-wider mt-8 opacity-60">
      <div className="flex flex-col items-center gap-2">
        <ShieldCheckIcon className="size-5" />
        <span>SOC2 TYPE II</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="border border-current rounded-full p-[2px]">
          <ShieldCheckIcon className="size-3" />
        </div>
        <span>ISO 27001</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <LockIcon className="size-5" />
        <span>FIPS 140-2</span>
      </div>
    </div>
  );
};
