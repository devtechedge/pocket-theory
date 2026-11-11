import clsx from "clsx";

interface LogoProps {
  className?: string;
  compact?: boolean;
}

export function Logo({ className, compact = false }: LogoProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2.5 select-none",
        className,
      )}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 40 40"
        fill="none"
        className="h-8 w-8 shrink-0"
      >
        <rect
          x="1"
          y="1"
          width="38"
          height="38"
          rx="8"
          fill="var(--pt-ink)"
        />
        <rect
          x="4.5"
          y="4.5"
          width="31"
          height="31"
          rx="5"
          stroke="var(--pt-border-strong)"
          strokeOpacity="0.45"
          strokeWidth="1"
        />
        <path
          d="M11 12.5H18.5C21.2614 12.5 23.5 14.7386 23.5 17.5C23.5 20.2614 21.2614 22.5 18.5 22.5H14.2V28H11V12.5ZM14.2 15.4V19.6H18.2C19.415 19.6 20.4 18.615 20.4 17.5C20.4 16.385 19.415 15.4 18.2 15.4H14.2Z"
          fill="var(--pt-surface-elevated)"
        />
        <path
          d="M22.5 12.5H31.5V15.4H28.6V28H25.4V15.4H22.5V12.5Z"
          fill="var(--pt-surface-elevated)"
        />
        <circle cx="30" cy="25.5" r="2.8" fill="var(--pt-tangerine)" />
      </svg>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[0.95rem] font-bold tracking-[0.08em] text-pt-ink">
            POCKET THEORY
          </span>
          <span className="mt-0.5 font-mono text-[0.65rem] tracking-[0.06em] text-pt-ink-muted uppercase">
            Useful tech. Zero fuss.
          </span>
        </span>
      )}
    </span>
  );
}
