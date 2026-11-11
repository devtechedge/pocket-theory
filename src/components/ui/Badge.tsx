import clsx from "clsx";
import type { ReactNode } from "react";

export type BadgeTone =
  | "neutral"
  | "tangerine"
  | "cobalt"
  | "lime"
  | "amber"
  | "danger";

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

const toneClasses: Record<BadgeTone, string> = {
  neutral:
    "border-pt-border bg-pt-surface text-pt-ink-muted",
  tangerine:
    "border-pt-tangerine/30 bg-pt-tangerine-soft text-pt-tangerine-ink",
  cobalt:
    "border-pt-cobalt/30 bg-pt-cobalt-soft text-pt-cobalt-ink",
  lime:
    "border-pt-lime-ink/25 bg-pt-lime-soft text-pt-lime-ink",
  amber:
    "border-pt-amber-ink/25 bg-pt-amber-soft text-pt-amber-ink",
  danger:
    "border-pt-danger/30 bg-pt-danger-soft text-pt-danger-ink",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[0.6875rem] font-semibold tracking-[0.04em] uppercase",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
