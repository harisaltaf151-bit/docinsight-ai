import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";

/**
 * Route group `(dashboard)` — wraps every authenticated page with the sidebar app shell.
 * The layout does not introduce any URL segment.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
