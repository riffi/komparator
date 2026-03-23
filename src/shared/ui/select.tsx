import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  wrapperClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, wrapperClassName, children, ...props }, ref) => (
    <div className={cn("relative", wrapperClassName)}>
      <select
        ref={ref}
        className={cn(
          "h-10 w-full appearance-none rounded-md border border-border/80 bg-code px-3 pr-10 text-sm text-text outline-none transition focus:border-primary",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dim" />
    </div>
  ),
);

Select.displayName = "Select";
