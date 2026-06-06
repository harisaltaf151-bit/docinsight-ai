"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Settings,
  FileSearch,
  Sparkles,
  KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ROUTES, PRIMARY_NAV, SECONDARY_NAV, type NavItem } from "@/lib/navigation";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  FileSearch,
  MessageSquare,
  Settings,
  Sparkles,
};

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = ICONS[item.icon] ?? FileSearch;
  return (
    <Link
      href={item.href as Route}
      className={cn(
        "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{item.title}</span>
      {active && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary" aria-hidden />
      )}
    </Link>
  );
}

import type { Route } from "next";

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:sticky md:top-0 md:flex">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        <Link
          href={ROUTES.home}
          className="flex items-center gap-2 text-sm font-semibold tracking-tight"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          DocInsight AI
        </Link>
        <Badge variant="secondary" className="ml-auto text-[10px]">
          v0.1
        </Badge>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-thin">
        <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
          Workspace
        </p>
        {PRIMARY_NAV.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}

        <p className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
          Account
        </p>
        {SECONDARY_NAV.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}

        <Separator className="my-4 bg-sidebar-border" />

        <Link
          href={ROUTES.onboarding}
          className="flex items-center gap-3 rounded-md border border-dashed border-sidebar-border px-3 py-2 text-xs text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/40"
        >
          <KeyRound className="h-3.5 w-3.5" />
          <span>Connect your provider</span>
        </Link>
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-sidebar-foreground/60">Theme</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
