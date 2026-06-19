'use client'

import * as React from "react"
import { useRef, useEffect, useState } from "react"
import { motion, useInView } from "framer-motion"
import { cn } from "@/lib/utils"

function useCounter(target: number, duration = 1800, active = true) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!active) return
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setValue(target); clearInterval(timer) }
      else setValue(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration, active])
  return value
}

interface StatCardProps {
  value: number
  suffix?: string
  label: string
  className?: string
}

export function StatCard({ value, suffix = "", label, className }: StatCardProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const count = useCounter(value, 1600, isInView)

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn("text-center", className)}
    >
      <p className="text-3xl sm:text-4xl font-bold gradient-text-strong mb-1">
        {count.toLocaleString()}{suffix}
      </p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </motion.div>
  )
}
