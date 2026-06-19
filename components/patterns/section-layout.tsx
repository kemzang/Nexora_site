import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const sectionVariants = cva(
  "relative py-28 sm:py-36 overflow-hidden",
  {
    variants: {
      background: {
        default: "",
        muted: "bg-muted/30",
        grid: "bg-grid",
        dots: "bg-dots",
      },
    },
    defaultVariants: {
      background: "default",
    },
  }
)

interface SectionLayoutProps extends React.ComponentProps<"section"> {
  background?: "default" | "muted" | "grid" | "dots"
}

function SectionLayout({
  className,
  background = "default",
  children,
  ...props
}: SectionLayoutProps) {
  return (
    <section
      className={cn(sectionVariants({ background }), className)}
      {...props}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {children}
      </div>
    </section>
  )
}

export { SectionLayout, sectionVariants }
