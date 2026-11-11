import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantMap: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-pt-tangerine text-pt-on-tangerine hover:bg-pt-tangerine-hover disabled:opacity-50",
  secondary:
    "border-pt-border-strong bg-pt-surface-elevated text-pt-ink hover:bg-pt-silver disabled:opacity-50",
  ghost:
    "border-transparent bg-transparent text-pt-ink hover:bg-pt-silver disabled:opacity-50",
  danger:
    "border-pt-danger/40 bg-pt-danger-soft text-pt-danger-ink hover:opacity-90 disabled:opacity-50",
};

const sizeMap: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-md border font-sans font-semibold transition-colors disabled:cursor-not-allowed",
        variantMap[variant],
        sizeMap[size],
        className,
      )}
      {...rest}
    />
  );
}
