import { useTranslate } from "@tolgee/react";
import { Button } from "@typebot.io/ui/components/Button";
import { PlusSignIcon } from "@typebot.io/ui/icons/PlusSignIcon";
import { BellIcon } from "@typebot.io/ui/icons/BellIcon";
import { SunIcon } from "@typebot.io/ui/icons/SunIcon";
import { MoonIcon } from "@typebot.io/ui/icons/MoonIcon";
import { useUser } from "@/features/user/hooks/useUser";
import { useWorkspace } from "@/features/workspace/WorkspaceProvider";
import { useRouter } from "next/router";
import { useTheme } from "next-themes";

export const DashboardHeader = () => {
  const { t } = useTranslate();
  const { user } = useUser();
  const { createWorkspace } = useWorkspace();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const handleCreateNewBot = () => {
    router.push("/typebots/new");
  };

  return (
    <header className="flex w-full h-20 bg-white dark:bg-[#1A1A1A] border-b border-gray-200 dark:border-gray-800 px-8 items-center justify-between shrink-0 transition-colors">

      {/* Left Action: Dashboard Title & Info */}
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-2" />
        <span className="text-sm text-gray-500 flex items-center gap-1 whitespace-nowrap">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          Last updated: 2 mins ago
        </span>
      </div>

      {/* Center Action: Search Bar */}
      <div className="flex-1 flex justify-center px-6">
        <div className="relative hidden md:block group w-full max-w-lg">
          <input
            type="text"
            placeholder="Search resources..."
            className="bg-gray-50 dark:bg-[#262626] text-sm text-gray-900 dark:text-gray-200 rounded-sm pl-10 pr-4 py-2 w-full border border-gray-200 dark:border-gray-700 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 focus:outline-none transition-all placeholder:text-gray-400"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
        </div>

        {/* Right Actions: Search + Profile */}
        <div className="flex items-center gap-6">


          {/* Notifications */}
          <button className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 rounded-md">
            <BellIcon className="w-5 h-5" />
          </button>

          {/* Create Bot Button (Yellow) */}
          <Button
            className="bg-[#FFE600] hover:bg-[#E6CF00] text-black font-bold border border-yellow-500/50"
            onClick={handleCreateNewBot}
          >
            <PlusSignIcon className="w-4 h-4 mr-2" />
            Create New Bot
          </Button>

          <div className="h-8 w-px bg-gray-200 dark:bg-gray-800" />

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full text-gray-400 hover:text-gray-900 dark:hover:text-white dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <SunIcon className="size-5" />
            ) : (
              <MoonIcon className="size-5" />
            )}
          </button>
        </div>
    </header>
  );
};
