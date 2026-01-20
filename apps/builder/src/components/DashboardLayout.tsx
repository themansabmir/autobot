import type { ReactNode } from "react";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { Sidebar } from "./Sidebar";

type Props = {
  children: ReactNode;
};

export const DashboardLayout = ({ children }: Props) => {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-1">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
