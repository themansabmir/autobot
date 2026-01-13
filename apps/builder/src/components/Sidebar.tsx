import { LayoutDashboardIcon } from "@typebot.io/ui/icons/LayoutDashboardIcon";
import { RobotIcon } from "@typebot.io/ui/icons/RobotIcon";
import { MegaphoneIcon } from "@typebot.io/ui/icons/MegaphoneIcon";
import { UsersIcon } from "@typebot.io/ui/icons/UsersIcon";
import { Settings01Icon } from "@typebot.io/ui/icons/Settings01Icon";
import Link from "next/link";
import { useRouter } from "next/router";
import { cn } from "@typebot.io/ui/lib/cn";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
  { label: "Typebots", href: "/typebots", icon: RobotIcon },
  { label: "Campaigns", href: "/campaigns", icon: MegaphoneIcon },
  { label: "Users", href: "/users", icon: UsersIcon },
  { label: "Settings", href: "/settings", icon: Settings01Icon },
];

export const Sidebar = () => {
  const router = useRouter();

  return (
    <aside className="flex flex-col w-64 bg-gray-1 dark:bg-gray-2 border-r border-gray-6">
      <nav className="flex flex-col gap-1 p-4">
        {navItems.map((item) => {
          const isActive =
            router.pathname === item.href ||
            router.pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-orange-3 text-orange-11 dark:bg-orange-4 dark:text-orange-11"
                  : "text-gray-11 hover:bg-gray-3 hover:text-gray-12"
              )}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
