import type { ReactNode } from "react";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { Sidebar } from "./Sidebar";

type Props = {
  children: ReactNode;
};

export const DashboardLayout = ({ children }: Props) => {
  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 bg-gray-1 dark:bg-gray-1">{children}</main>
      </div>
    </div>
  );
};
