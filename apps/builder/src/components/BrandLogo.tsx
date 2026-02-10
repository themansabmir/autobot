import { cn } from "@typebot.io/ui/lib/cn";
import Link from "next/link";

type Props = {
  type?: "sidebar" | "auth" | "header";
  className?: string;
};

export const BrandLogo = ({ type = "sidebar", className }: Props) => {
  const isAuth = type === "auth";
  const isHeader = type === "header";
  const isSidebar = type === "sidebar";

  const content = (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "flex items-center justify-center bg-[#FFE600] rounded-sm text-black font-bold shrink-0",
          isAuth && "px-2 py-1 text-xl",
          !isAuth && "w-8 h-8 text-sm",
        )}
      >
        EY
      </div>
      <span
        className={cn(
          "font-bold tracking-tight",
          // Sidebar is always dark, so force white text
          isSidebar && "text-white",
          // Auth pages use specific gray scale
          isAuth && "text-xl tracking-wide uppercase text-gray-12",
          // Header uses theme-aware colors
          isHeader && "text-lg text-gray-900 dark:text-gray-100",
          "whitespace-nowrap",
        )}
      >
        Whatsapp Bot
      </span>
    </div>
  );

  if (isAuth) return content;

  return (
    <Link
      href="/dashboard"
      className="cursor-pointer hover:opacity-90 transition-opacity"
    >
      {content}
    </Link>
  );
};
