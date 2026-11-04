import * as React from "react";

import { cn } from "@/lib/utils";

type TextareaProps = React.ComponentProps<"textarea"> & {
  icon?: string;
};

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, icon, ...props }, ref) => {
    const textarea = (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-none placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          icon && "ltr:pl-10 rtl:pr-10",
          className,
        )}
        ref={ref}
        {...props}
      />
    );

    if (!icon) return textarea;

    return (
      <div className="relative w-full">
        <span
          aria-hidden="true"
          className="material-icons-round pointer-events-none absolute left-3 rtl:left-auto rtl:right-3 top-3 text-[18px] leading-none text-primary"
        >
          {icon}
        </span>
        {textarea}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
