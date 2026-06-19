import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface PageHeaderProps {
  badge?: string
  title: React.ReactNode
  subtitle?: string
  className?: string
}

export function PageHeader({ badge, title, subtitle, className }: PageHeaderProps) {
  return (
    <div className={cn("text-center mb-16", className)}>
      {badge && (
        <Badge variant="primary" className="mb-5">
          {badge}
        </Badge>
      )}
      <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4 text-balance">
        {title}
      </h1>
      {subtitle && (
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  )
}
