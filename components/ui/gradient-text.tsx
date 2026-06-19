import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const gradientTextVariants = cva(
  "bg-clip-text text-transparent",
  {
    variants: {
      variant: {
        default: "gradient-text",
        strong: "gradient-text-strong",
        animated: "gradient-text-animated",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function GradientText({
  className,
  variant = "default",
  children,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof gradientTextVariants>) {
  return (
    <span
      className={cn(gradientTextVariants({ variant }), className)}
      {...props}
    >
      {children}
    </span>
  )
}

export { GradientText, gradientTextVariants }
