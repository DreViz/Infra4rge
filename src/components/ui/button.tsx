"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-40 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/80 shadow-sm active:scale-[0.98]",
        secondary:
          "bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80 active:scale-[0.98]",
        ghost:
          "text-muted-foreground hover:text-foreground hover:bg-muted active:scale-[0.98]",
        outline:
          "border border-border text-foreground hover:bg-muted hover:border-ring active:scale-[0.98]",
        destructive:
          "bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 active:scale-[0.98]",
        glow:
          "bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-900/40 ring-1 ring-violet-500/20 hover:ring-violet-400/30 active:scale-[0.98]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-7 px-2.5 text-xs rounded-md",
        lg: "h-11 px-6 text-base",
        xl: "h-13 px-8 text-base",
        icon: "h-9 w-9",
        "icon-sm": "h-7 w-7",
        "icon-xs": "h-6 w-6",
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
