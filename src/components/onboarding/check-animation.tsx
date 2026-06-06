import { cn } from "@/lib/utils";

interface CheckAnimationProps {
  className?: string;
}

/**
 * SVG checkmark drawn in two strokes: a circle that traces, then a check
 * that follows. Pure CSS, no library.
 */
export function CheckAnimation({ className }: CheckAnimationProps) {
  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center text-zinc-900 dark:text-zinc-50",
        className,
      )}
      style={{ animation: "check-pop 420ms cubic-bezier(0.2, 0, 0, 1) both" }}
    >
      <svg
        viewBox="0 0 64 64"
        className="h-16 w-16"
        fill="none"
        aria-hidden
      >
        <circle
          cx="32"
          cy="32"
          r="29"
          stroke="currentColor"
          strokeOpacity="0.18"
          strokeWidth="2"
        />
        <circle
          cx="32"
          cy="32"
          r="29"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          style={{
            strokeDasharray: 183,
            strokeDashoffset: 183,
            animation: "draw-stroke 520ms cubic-bezier(0.65, 0, 0.35, 1) 80ms forwards",
          }}
        />
        <path
          d="M20.5 32.5L28 40L44 24"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: 38,
            strokeDashoffset: 38,
            animation: "draw-stroke 380ms cubic-bezier(0.65, 0, 0.35, 1) 480ms forwards",
          }}
        />
      </svg>
    </div>
  );
}
