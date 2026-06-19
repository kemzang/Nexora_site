import * as React from "react"
import Link from "next/link"
import { CheckCircle, ChevronRight, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"

interface PricingCardProps {
  name: string
  price: string
  period?: string
  features: string[]
  href: string
  popular?: boolean
  popularLabel?: string
  models?: string
  ctaText: string
  className?: string
}

export function PricingCard({
  name,
  price,
  period,
  features,
  href,
  popular = false,
  popularLabel,
  models,
  ctaText,
  className,
}: PricingCardProps) {
  return (
    <GlassCard
      variant="hover"
      className={cn(
        "h-full relative flex flex-col",
        popular ? "border-animated glow-lg" : "",
        className
      )}
    >
      {popular && popularLabel && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
          <span className="relative inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-3.5 py-1 rounded-full shadow-lg">
            <Star className="w-2.5 h-2.5" />
            {popularLabel}
          </span>
        </div>
      )}
      <div className={cn("text-center", popular ? "pt-8" : "pt-5", "px-6")}>
        <h3 className="text-foreground text-base font-bold">{name}</h3>
        <div className="mt-3">
          <span className="text-4xl font-bold tracking-tight">{price}</span>
          {period && (
            <span className="text-muted-foreground text-sm ml-1">{period}</span>
          )}
        </div>
        {models && (
          <p className="text-xs text-muted-foreground/70 mt-1 leading-relaxed">
            {models}
          </p>
        )}
      </div>
      <div className="space-y-4 flex-1 flex flex-col px-6 pb-6 pt-4">
        <div className="space-y-2.5 flex-1">
          {features.map((feature) => (
            <div key={feature} className="flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-foreground/60 shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground">{feature}</span>
            </div>
          ))}
        </div>
        <Link href={href}>
          <Button
            className="w-full"
            variant={popular ? "default" : "outline"}
          >
            {ctaText}
            <ChevronRight className="ml-1 w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
    </GlassCard>
  )
}
