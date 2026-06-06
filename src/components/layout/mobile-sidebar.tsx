"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { PRIMARY_NAV, SECONDARY_NAV, type NavItem } from "@/lib/navigation";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard: ({ className }) => <span className={className} aria-hidden>▦</span>,
  FileSearch: ({ className }) => <span className={className} aria-hidden>🔎</span>,
  MessageSquare: ({ className }) => <span className={className} aria-hidden>💬</span>,
  Settings: ({ className }) => <span className={className} aria-hidden>⚙</span>,
  Sparkles: ({ className }) => <span className={className} aria-hidden>✦</span>,
};

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const renderItem = (item: NavItem) => (
    <li key={item.href}>
      <Link
        href={item.href as Route}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive(item.href)
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
        )}
      >
        <span className="h-4 w-4" />
        {item.title}
      </Link>
    </li>
  );
  return (
    <ul className="space-y-1">
      {PRIMARY_NAV.map(renderItem)}
      <li className="my-2 border-t border-border" />
      {SECONDARY_NAV.map(renderItem)}
    </ul>
  );
}

import type { Route } from "next";

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="hidden" aria-hidden />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <span className="text-sm font-semibold">DocInsight AI</span>
        </div>
        <nav className="p-3">
          <NavList onNavigate={() => onOpenChange(false)} />
        </nav>
      </SheetContent>
    </Sheet>
  );
}
