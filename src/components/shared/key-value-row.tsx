"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A 2-column key/value row used in settings, metadata panels, etc.
 */
export function KeyValueRow({
  label,
  value,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4 py-2", className)}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
