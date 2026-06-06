import { cn } from "@/lib/utils";

interface BrandMarkProps {
  size?: number;
  className?: string;
}

/**
 * DocInsight AI brand mark — a small document glyph with three text rules and a
 * checkmark. Monochrome, geometric, no AI-slop imagery.
 */
export function BrandMark({ size = 22, className }: BrandMarkProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md bg-zinc-950 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950",
        className,
      )}
      style={{ width: size + 8, height: size + 8 }}
      aria-hidden
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 22 22"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5 5.5C5 4.67 5.67 4 6.5 4H13L17 8V16.5C17 17.33 16.33 18 15.5 18H6.5C5.67 18 5 17.33 5 16.5V5.5Z"
          fill="currentColor"
          fillOpacity="0.12"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path d="M7 9H14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M7 12H11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path
          d="M10.5 15.5L12 17L15 14"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
