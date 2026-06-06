"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { UserMenu } from "@/components/layout/user-menu";

interface NavbarProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}

export function Navbar({ title, description, actions }: NavbarProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu className="h-4 w-4" />
        </Button>
        <MobileSidebar open={open} onOpenChange={setOpen} />
      </div>

      <div className="min-w-0 flex-1">
        {title && <h1 className="truncate text-sm font-semibold tracking-tight">{title}</h1>}
        {description && (
          <p className="truncate text-xs text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {actions}
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
