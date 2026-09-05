import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Material 3 chips/labels: pill shape, tonal containers, medium weight.
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium tracking-[0.02em] transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary-container text-on-primary-container hover:bg-primary-container/85",
        secondary:
          "border-transparent bg-secondary-container text-secondary-foreground hover:bg-secondary-container/85",
        tertiary:
          "border-transparent bg-tertiary-container text-on-tertiary-container hover:bg-tertiary-container/85",
        destructive:
          "border-transparent bg-error-container text-on-error-container hover:bg-error-container/85",
        outline: "border-outline text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);


export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
