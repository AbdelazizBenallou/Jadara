import * as React from "react";

import { cn } from "@/lib/utils";

type InputProps = React.ComponentProps<"input"> & {
  icon?: string;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, ...props }, ref) => {
    const input = (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          icon && "ltr:pl-10 rtl:pr-10",
          className,
        )}
        ref={ref}
        {...props}
      />
    );

    if (!icon) return input;

    return (
      <div className="relative w-full">
        <span
          aria-hidden="true"
          className="material-icons-round pointer-events-none absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-[18px] leading-none text-primary"
        >
          {icon}
        </span>
        {input}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
