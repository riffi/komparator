import * as React from "react";
import { cn } from "@/shared/lib/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-md border border-border/80 bg-code px-3 text-sm text-text outline-none transition placeholder:text-dim focus:border-primary",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";