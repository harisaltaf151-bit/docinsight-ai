import * as React from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";

/**
 * App shell for authenticated pages: persistent sidebar + scrollable content area.
 */
export function AppShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className={cn("flex min-w-0 flex-1 flex-col", className)}>{children}</div>
    </div>
  );
}
