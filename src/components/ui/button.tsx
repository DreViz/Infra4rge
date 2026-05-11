"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-40 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          "bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-900/25 active:scale-[0.98]",
        secondary:
          "bg-[#1a1a1a] text-[#fafafa] border border-[#2a2a2a] hover:bg-[#222] hover:border-[#333] active:scale-[0.98]",
        ghost:
          "text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#161616] active:scale-[0.98]",
        outline:
          "border border-[#2a2a2a] text-[#fafafa] hover:bg-[#161616] hover:border-[#333] active:scale-[0.98]",
        destructive:
          "bg-red-900/20 text-red-400 border border-red-900/30 hover:bg-red-900/30 active:scale-[0.98]",
        glow:
          "bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-900/40 ring-1 ring-violet-500/20 hover:ring-violet-400/30 active:scale-[0.98]",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        default: "h-9 px-4",
        lg: "h-11 px-6 text-base",
        xl: "h-13 px-8 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
