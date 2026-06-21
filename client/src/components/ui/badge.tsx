import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  // Pill shape, no hard border by default, compact & readable
  "inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-colors overflow-hidden",
  {
    variants: {
      variant: {
        // Soft tinted primary
        default:
          "bg-primary/10 text-primary",
        // Neutral chip
        secondary:
          "bg-secondary text-secondary-foreground",
        // Destructive — soft red tint
        destructive:
          "bg-destructive/10 text-destructive dark:bg-destructive/20",
        // Success — Apple Green
        success:
          "bg-success/12 text-success dark:bg-success/15",
        // Warning — Apple Amber
        warning:
          "bg-warning/15 text-warning dark:bg-warning/15",
        // Info — same as primary
        info:
          "bg-info/10 text-info",
        // Outline — hairline ring, no fill
        outline:
          "ring-1 ring-border text-foreground bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
