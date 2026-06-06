import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  label?: string;
}

const SIZE = {
  sm: "h-3 w-3",
  md: "h-5 w-5",
  lg: "h-8 w-8",
} as const;

export function LoadingSpinner({ size = "md", label, className, ...props }: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}
      {...props}
    >
      <Loader2 className={cn("animate-spin", SIZE[size])} />
      {label && <span>{label}</span>}
      <span className="sr-only">Loading</span>
    </div>
  );
}
