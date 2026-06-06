"use client";

import * as React from "react";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Placeholder user menu. Real auth wiring comes later.
 */
export function UserMenu() {
  return (
    <Button variant="ghost" size="icon" aria-label="User menu">
      <User className="h-4 w-4" />
    </Button>
  );
}
