import type { Route } from "next";

export type AppRoute =
  | "/"
  | "/onboarding"
  | "/dashboard"
  | "/analyze"
  | "/results"
  | "/chat"
  | "/settings";

export const ROUTES = {
  home: "/" as Route,
  onboarding: "/onboarding" as Route,
  dashboard: "/dashboard" as Route,
  analyze: "/analyze" as Route,
  results: "/results" as Route,
  chat: "/chat" as Route,
  settings: "/settings" as Route,
} as const satisfies Record<string, Route>;

export interface NavItem {
  title: string;
  href: AppRoute;
  description?: string;
  icon: string;
}

export const PRIMARY_NAV: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { title: "Analyze", href: "/analyze", icon: "FileSearch" },
  { title: "Results", href: "/results", icon: "Sparkles" },
  { title: "Chat", href: "/chat", icon: "MessageSquare" },
];

export const SECONDARY_NAV: NavItem[] = [
  { title: "Settings", href: "/settings", icon: "Settings" },
];
