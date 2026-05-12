import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex w-full rounded-xl border border-[#222] bg-[#111] px-4 py-3 text-sm text-[#fafafa] placeholder:text-[#52525b] resize-none",
          "focus:outline-none focus:ring-1 focus:ring-violet-600/60 focus:border-violet-600/40",
          "transition-colors duration-200",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
