import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success: "border-transparent bg-success-50 text-success-700 dark:bg-success/20",
        warning: "border-transparent bg-warning-50 text-warning-foreground dark:bg-warning/20",
        error: "border-transparent bg-error-50 text-error-600 dark:bg-error-500/20",
        gray: "border-transparent bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
        blue: "border-transparent bg-primary-50 text-primary-700 dark:bg-primary/20",
        purple: "border-transparent bg-purple-50 text-purple-700 dark:bg-purple-500/20",
        amber: "border-transparent bg-amber-50 text-amber-700 dark:bg-amber-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
