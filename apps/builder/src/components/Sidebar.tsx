import { HardDriveIcon } from "@typebot.io/ui/icons/HardDriveIcon";
import { LayoutDashboardIcon } from "@typebot.io/ui/icons/LayoutDashboardIcon";
import { MegaphoneIcon } from "@typebot.io/ui/icons/MegaphoneIcon";
import { Settings01Icon } from "@typebot.io/ui/icons/Settings01Icon";
import { UsersIcon } from "@typebot.io/ui/icons/UsersIcon";
import { cn } from "@typebot.io/ui/lib/cn";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { useUser } from "@/features/user/hooks/useUser";
import { WorkspaceDropdown } from "@/features/workspace/components/WorkspaceDropdown";
import { WorkspaceSettingsDialog } from "@/features/workspace/components/WorkspaceSettingsDialog";
import { useWorkspace } from "@/features/workspace/WorkspaceProvider";
import { BrandLogo } from "./BrandLogo";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
  { label: "Bots", href: "/buildthebot", icon: HardDriveIcon },
  { label: "Campaigns", href: "/campaigns", icon: MegaphoneIcon },
  { label: "Users", href: "/users", icon: UsersIcon },
];

export const Sidebar = () => {
  const router = useRouter();
  const { user, logOut } = useUser();
  const { workspace, switchWorkspace, createWorkspace } = useWorkspace();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleCreateNewWorkspace = () =>
    createWorkspace(user?.name ?? undefined);

  const handleLogout = () => {
    setIsLoggingOut(true);
    logOut();
  };

  return (
    <aside className="flex flex-col w-72 bg-[#1A1A1A] border-r border-gray-800 text-white shrink-0">
      {/* Brand Header */}
      <div className="p-6">
        <BrandLogo type="sidebar" className="text-white" />
      </div>

      {/* Navigation */}
      <nav className="flex flex-col flex-1 px-4 gap-1 mt-4">
        {navItems.map((item) => {
          const isCampaignAnalyticsPage =
            router.asPath.includes("/campaigns/") &&
            router.asPath.includes("/buildthebot/");

          const isActive =
            // Campaign analytics pages are nested under /buildthebot but belong to Campaigns
            item.href === "/campaigns"
              ? router.pathname.startsWith("/campaigns") ||
                isCampaignAnalyticsPage
              : // Exclude /buildthebot match when on a campaign analytics page
                (router.pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    router.pathname.startsWith(`${item.href}/`))) &&
                !(item.href === "/buildthebot" && isCampaignAnalyticsPage);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all group relative",
                isActive
                  ? "text-white bg-[#2E2E38]"
                  : "text-gray-400 hover:text-white hover:bg-[#2E2E38]/50",
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FFE600] rounded-l-md" />
              )}
              <item.icon
                className={cn(
                  "size-5",
                  isActive
                    ? "text-[#FFE600]"
                    : "text-gray-500 group-hover:text-gray-300",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Settings / Profile */}
      <div className="p-4 border-t border-gray-800 space-y-2">
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium w-full text-left transition-all text-gray-400 hover:text-white hover:bg-[#2E2E38]/50"
        >
          <Settings01Icon className="size-5 text-gray-500" />
          Settings
        </button>

        <div className="pt-2">
          <WorkspaceDropdown
            isLoggingOut={isLoggingOut}
            currentWorkspace={workspace}
            onLogoutClick={handleLogout}
            onCreateNewWorkspaceClick={handleCreateNewWorkspace}
            onWorkspaceSelected={switchWorkspace}
          />
        </div>
      </div>
      {user && workspace && (
        <WorkspaceSettingsDialog
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          user={user}
          workspace={workspace}
        />
      )}
    </aside>
  );
};
