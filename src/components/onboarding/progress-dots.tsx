import { cn } from "@/lib/utils";

interface ProgressDotsProps {
  total: number;
  current: number;
  className?: string;
}

/**
 * Minimal step indicator: 1·2·3 with the active one in solid ink and the
 * rest as a hairline. Inspired by Linear's checkpoint pips.
 */
export function ProgressDots({ total, current, className }: ProgressDotsProps) {
  return (
    <ol
      className={cn("flex items-center gap-2 text-xs text-zinc-500", className)}
      aria-label={`Step ${current} of ${total}`}
    >
      {Array.from({ length: total }).map((_, i) => {
        const step = i + 1;
        const isActive = step === current;
        const isComplete = step < current;
        return (
          <li key={step} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-medium num-tabular transition-colors",
                isActive && "border-zinc-950 bg-zinc-950 text-zinc-50 dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-950",
                isComplete && "border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300",
                !isActive && !isComplete && "border-zinc-200 text-zinc-400 dark:border-zinc-800 dark:text-zinc-600",
              )}
              aria-current={isActive ? "step" : undefined}
            >
              {isComplete ? (
                <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" aria-hidden>
                  <path
                    d="M2.5 6.2L4.8 8.5L9.5 3.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                step
              )}
            </span>
            {step < total && (
              <span
                className={cn(
                  "h-px w-6 transition-colors",
                  isComplete ? "bg-zinc-300 dark:bg-zinc-700" : "bg-zinc-200 dark:bg-zinc-800",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
