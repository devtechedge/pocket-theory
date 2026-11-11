"use client";

interface QuantityStepperProps {
  value: number;
  max?: number;
  disabled?: boolean;
  onChange: (next: number) => void;
  label?: string;
}

export function QuantityStepper({
  value,
  max = 10,
  disabled = false,
  onChange,
  label = "Quantity",
}: QuantityStepperProps) {
  const safeMax = Math.max(1, Math.min(10, max));

  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex h-9 items-center rounded-md border border-pt-border-strong bg-pt-surface-elevated"
    >
      <button
        type="button"
        disabled={disabled || value <= 1}
        onClick={() => onChange(Math.max(1, value - 1))}
        aria-label={`Decrease ${label.toLowerCase()}`}
        className="inline-flex h-full w-9 items-center justify-center font-mono text-sm font-bold text-pt-ink transition-colors hover:bg-pt-silver disabled:cursor-not-allowed disabled:opacity-40"
      >
        -
      </button>
      <span
        aria-live="polite"
        className="inline-flex min-w-[2.25rem] items-center justify-center border-x border-pt-border px-2 font-mono text-xs font-bold text-pt-ink"
      >
        {value}
      </span>
      <button
        type="button"
        disabled={disabled || value >= safeMax}
        onClick={() => onChange(Math.min(safeMax, value + 1))}
        aria-label={`Increase ${label.toLowerCase()}`}
        className="inline-flex h-full w-9 items-center justify-center font-mono text-sm font-bold text-pt-ink transition-colors hover:bg-pt-silver disabled:cursor-not-allowed disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}
