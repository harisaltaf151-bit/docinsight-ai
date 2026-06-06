import { cn } from "@/lib/utils";
import { PROVIDER_META, type ProviderId } from "@/types/provider";

interface ProviderMarkProps {
  id: ProviderId;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Provider monogram — a small box with a single distinguishing letter.
 * Monochrome on purpose: avoids AI-slop color coding while still
 * giving each provider a recognizable visual anchor.
 */
export function ProviderMark({ id, size = "md", className }: ProviderMarkProps) {
  const meta = PROVIDER_META[id];
  const letter = meta.name[0]?.toUpperCase() ?? "?";
  const sizeClass = size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 font-semibold tracking-tight text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50",
        sizeClass,
        className,
      )}
      aria-hidden
    >
      {letter}
    </span>
  );
}
