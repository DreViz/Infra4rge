import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "violet" | "cyan" | "green" | "yellow" | "red";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-[#1a1a1a] text-[#a1a1aa] border-[#2a2a2a]",
    violet: "bg-violet-950/50 text-violet-300 border-violet-800/50",
    cyan: "bg-cyan-950/50 text-cyan-300 border-cyan-800/50",
    green: "bg-emerald-950/50 text-emerald-300 border-emerald-800/50",
    yellow: "bg-yellow-950/50 text-yellow-300 border-yellow-800/50",
    red: "bg-red-950/50 text-red-300 border-red-800/50",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium border",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
