import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const glassCardVariants = cva(
  "rounded-2xl border backdrop-blur-xl overflow-hidden",
  {
    variants: {
      variant: {
        default: "glass",
        strong: "glass-strong",
        hover: "glass glass-hover",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function GlassCard({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof glassCardVariants>) {
  return (
    <div
      className={cn(glassCardVariants({ variant }), className)}
      {...props}
    />
  )
}

export { GlassCard, glassCardVariants }
