import * as React from "react"
import { cn } from "@/lib/utils"
import { GlassCard } from "@/components/ui/glass-card"
import type { LucideIcon } from "lucide-react"

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  className?: string
}

export function FeatureCard({ icon: Icon, title, description, className }: FeatureCardProps) {
  return (
    <GlassCard
      variant="hover"
      className={cn("h-full group p-6 cursor-default", className)}
    >
      <div className="relative w-12 h-12 bg-muted rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-5.5 h-5.5 text-foreground/70" />
      </div>
      <h3 className="text-foreground font-semibold text-base mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed text-sm">
        {description}
      </p>
    </GlassCard>
  )
}
