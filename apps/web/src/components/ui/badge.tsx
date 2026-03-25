import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "muted"
  | "chatgpt"
  | "perplexity"
  | "gemini"
  | "claude"
  | "grok"
  | "deepseek";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-accent-light text-accent-text",
  success: "bg-success-light text-emerald-700",
  warning: "bg-warning-light text-amber-700",
  danger: "bg-danger-light text-red-700",
  info: "bg-info-light text-indigo-700",
  muted: "bg-bg-muted text-text-muted",
  chatgpt: "bg-emerald-50 text-emerald-700",
  gemini: "bg-blue-50 text-blue-700",
  claude: "bg-amber-50 text-amber-700",
  perplexity: "bg-gray-100 text-gray-600",
  grok: "bg-gray-100 text-gray-600",
  deepseek: "bg-gray-100 text-gray-600",
};

export function Badge({
  variant = "default",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
