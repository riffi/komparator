import * as React from "react";
import { cn } from "@/shared/lib/cn";

const buttonVariants = {
  default:
    "bg-primary text-white hover:brightness-110 border border-transparent shadow-[0_0_0_1px_rgba(255,255,255,0.02)]",
  ghost: "border border-border/80 bg-transparent text-muted hover:bg-surface hover:text-text",
  icon: "border border-border/80 bg-transparent text-muted hover:bg-surface hover:text-text",
} as const;

const buttonSizes = {
  default: "h-10 px-4 py-2",
  sm: "h-9 px-3 py-2 text-sm",
  icon: "h-9 w-9",
} as const;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:pointer-events-none disabled:opacity-50",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = "Button";