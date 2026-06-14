'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, TrendingDown, Zap, Activity, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'

type Period = '7d' | '30d' | '3m' | '1y'

const PERIODS: { id: Period; label: string; days: number }[] = [
  { id: '7d', label: '7 jours', days: 7 },
  { id: '30d', label: '30 jours', days: 30 },
  { id: '3m', label: '3 mois', days: 90 },
  { id: '1y', label: '1 an', days: 365 },
]

interface DayData {
  date: string
  tokens: number
  requests: number
}

function generateDateRange(days: number): string[] {
  const dates: string[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

function formatDateLabel(dateStr: string, period: Period): string {
  const d = new Date(dateStr)
  if (period === '7d') return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
  if (period === '30d') return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  if (period === '3m') return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  return d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
}

function numberShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toString()
}

interface AreaChartProps {
  data: DayData[]
  period: Period
}

function AreaChart({ data, period }: AreaChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const W = 900
  const H = 220
  const PAD = { t: 16, r: 20, b: 40, l: 56 }
  const CW = W - PAD.l - PAD.r
  const CH = H - PAD.t - PAD.b

  const maxVal = Math.max(...data.map(d => d.tokens), 1)
  const N = data.length

  const sx = (i: number) => (N <= 1 ? CW / 2 : (i / (N - 1)) * CW)
  const sy = (v: number) => CH - (v / maxVal) * CH

  const pts = data.map((d, i) => ({ x: sx(i), y: sy(d.tokens), ...d }))

  const linePath = pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x.toFixed(1)},${p.y.toFixed(1)}`
    const prev = pts[i - 1]
    const cpx = (prev.x + p.x) / 2
    return `${acc} C ${cpx.toFixed(1)},${prev.y.toFixed(1)} ${cpx.toFixed(1)},${p.y.toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`
  }, '')

  const areaPath = N > 0
    ? `${linePath} L ${pts[N - 1].x.toFixed(1)},${CH} L ${pts[0].x.toFixed(1)},${CH} Z`
    : ''

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    v: maxVal * f,
    y: sy(maxVal * f),
    label: numberShort(Math.round(maxVal * f)),
  }))

  // X labels: spread evenly, max 8
  const step = Math.max(1, Math.ceil(N / (period === '7d' ? 7 : period === '30d' ? 8 : period === '3m' ? 9 : 12)))
  const xLabels = pts.filter((_, i) => i % step === 0 || i === N - 1)

  const hovered = hoveredIdx !== null ? pts[hoveredIdx] : null
  const colW = N > 1 ? CW / (N - 1) : CW

  return (
    <div className="relative w-full select-none">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" style={{ height: '220px' }}>
        <defs>
          <linearGradient id="nexoraGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
          <clipPath id="chartClip">
            <rect x="0" y="0" width={CW} height={CH} />
          </clipPath>
        </defs>
        <g transform={`translate(${PAD.l},${PAD.t})`}>
          {/* Horizontal grid lines */}
          {yTicks.map((t, i) => (
            <line key={i} x1={0} y1={t.y} x2={CW} y2={t.y}
              stroke="rgba(255,255,255,0.05)" strokeWidth={1}
              strokeDasharray={i > 0 ? '4,4' : undefined} />
          ))}

          {/* Hover vertical line */}
          {hovered && (
            <line x1={hovered.x} y1={0} x2={hovered.x} y2={CH}
              stroke="rgba(99,102,241,0.3)" strokeWidth={1} strokeDasharray="4,4" />
          )}

          {/* Area fill */}
          {N > 0 && <path d={areaPath} fill="url(#nexoraGrad)" clipPath="url(#chartClip)" />}

          {/* Line */}
          {N > 0 && (
            <path d={linePath} fill="none" stroke="#6366f1" strokeWidth={2.5}
              strokeLinejoin="round" strokeLinecap="round" />
          )}

          {/* Hover dot */}
          {hovered && (
            <circle cx={hovered.x} cy={hovered.y} r={5}
              fill="#6366f1" stroke="var(--background)" strokeWidth={2.5} />
          )}

          {/* Invisible hover zones */}
          {pts.map((p, i) => (
            <rect key={i}
              x={Math.max(0, p.x - colW / 2)} y={0}
              width={colW} height={CH}
              fill="transparent"
              style={{ cursor: 'crosshair' }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          ))}

          {/* Y axis labels */}
          {yTicks.map((t, i) => (
            <text key={i} x={-10} y={t.y + 4}
              textAnchor="end" fontSize={11}
              fill="rgba(255,255,255,0.28)"
              style={{ fontFamily: 'inherit' }}>
              {t.label}
            </text>
          ))}

          {/* X axis labels */}
          {xLabels.map((p, i) => (
            <text key={i} x={p.x} y={CH + 26}
              textAnchor="middle" fontSize={11}
              fill="rgba(255,255,255,0.28)"
              style={{ fontFamily: 'inherit' }}>
              {formatDateLabel(p.date, period)}
            </text>
          ))}
        </g>
      </svg>

      {/* Floating tooltip */}
      {hovered && (
        <div
          className="absolute pointer-events-none z-20 bg-card border border-border/70 rounded-xl px-3 py-2.5 shadow-2xl -translate-x-1/2 whitespace-nowrap"
          style={{
            left: `${((hovered.x + PAD.l) / W) * 100}%`,
            top: `${Math.max(0, ((hovered.y + PAD.t) / H) * 100 - 22)}%`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <p className="text-[11px] text-muted-foreground mb-0.5">{new Date(hovered.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <p className="font-bold text-sm text-foreground">{hovered.tokens.toLocaleString('fr-FR')} tokens</p>
          <p className="text-[11px] text-muted-foreground">{hovered.requests} requête{hovered.requests > 1 ? 's' : ''}</p>
        </div>
      )}
    </div>
  )
}

export default function UtilisationSection() {
  const { user } = useAuth()
  const [period, setPeriod] = useState<Period>('30d')
  const [data, setData] = useState<DayData[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async (p: Period, userId: string) => {
    setLoading(true)
    try {
      const days = PERIODS.find(x => x.id === p)!.days
      const fromDate = new Date()
      fromDate.setDate(fromDate.getDate() - days + 1)
      const fromStr = fromDate.toISOString().split('T')[0]

      const fromIso = new Date(fromStr + 'T00:00:00.000Z').toISOString()
      const { data: rows } = await supabase
        .from('usage_sessions')
        .select('started_at, tokens_total, tokens_input')
        .eq('user_id', userId)
        .gte('started_at', fromIso)

      const byDate: Record<string, { tokens: number; requests: number }> = {}
      for (const row of (rows || []) as { started_at: string; tokens_total: number | null; tokens_input: number | null }[]) {
        const date = row.started_at.split('T')[0]
        const tokens = row.tokens_total ?? row.tokens_input ?? 0
        if (!byDate[date]) byDate[date] = { tokens: 0, requests: 0 }
        byDate[date].tokens += tokens
        byDate[date].requests += 1
      }

      const allDates = generateDateRange(days)
      const filled: DayData[] = allDates.map(date => ({
        date,
        tokens: byDate[date]?.tokens || 0,
        requests: byDate[date]?.requests || 0,
      }))
      setData(filled)
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (user?.id) fetchData(period, user.id) }, [period, user?.id, fetchData])

  const totalTokens = data.reduce((s, d) => s + d.tokens, 0)
  const totalRequests = data.reduce((s, d) => s + d.requests, 0)
  const peakDay = data.reduce((max, d) => d.tokens > max.tokens ? d : max, data[0] || { date: '', tokens: 0, requests: 0 })
  const avgPerDay = data.length > 0 ? Math.round(totalTokens / data.length) : 0
  const hasData = totalTokens > 0

  // Compare with previous period
  const midpoint = Math.floor(data.length / 2)
  const firstHalf = data.slice(0, midpoint).reduce((s, d) => s + d.tokens, 0)
  const secondHalf = data.slice(midpoint).reduce((s, d) => s + d.tokens, 0)
  const trend = firstHalf === 0 ? 0 : ((secondHalf - firstHalf) / firstHalf) * 100

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Utilisation</h1>
          <p className="text-muted-foreground text-sm mt-1">Consommation globale de tokens sur la période</p>
        </div>
        {/* Period filter */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-border/50">
          {PERIODS.map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                period === p.id
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.05]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Tokens consommés',
            value: loading ? '—' : totalTokens.toLocaleString('fr-FR'),
            icon: Zap,
            color: 'text-indigo-400',
            bg: 'from-indigo-500/20 to-indigo-500/5',
          },
          {
            label: 'Requêtes totales',
            value: loading ? '—' : totalRequests.toLocaleString('fr-FR'),
            icon: Activity,
            color: 'text-violet-400',
            bg: 'from-violet-500/20 to-violet-500/5',
          },
          {
            label: 'Moyenne / jour',
            value: loading ? '—' : numberShort(avgPerDay),
            icon: Calendar,
            color: 'text-sky-400',
            bg: 'from-sky-500/20 to-sky-500/5',
          },
          {
            label: 'Pic journalier',
            value: loading ? '—' : numberShort(peakDay?.tokens || 0),
            icon: TrendingUp,
            color: 'text-emerald-400',
            bg: 'from-emerald-500/20 to-emerald-500/5',
          },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="glass">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">{s.label}</p>
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${s.bg} flex items-center justify-center`}>
                    <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                  </div>
                </div>
                <p className="text-xl font-bold tracking-tight">{s.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Chart card */}
      <Card className="glass">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              Consommation de tokens
              {!loading && hasData && trend !== 0 && (
                <span className={`flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-md ${
                  trend > 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
                }`}>
                  {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(Math.round(trend))}%
                </span>
              )}
            </CardTitle>
            <span className="text-xs text-muted-foreground">{PERIODS.find(p => p.id === period)?.label}</span>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {loading ? (
            <div className="h-[220px] skeleton rounded-xl" />
          ) : !hasData ? (
            <div className="h-[220px] flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-7 h-7 text-indigo-400/50" />
              </div>
              <p className="font-medium text-foreground mb-1">Aucune donnée pour cette période</p>
              <p className="text-sm text-muted-foreground">Commencez à utiliser Nexora dans VS Code pour voir vos statistiques</p>
            </div>
          ) : (
            <AreaChart data={data} period={period} />
          )}
        </CardContent>
      </Card>

      {/* Peak day info */}
      {!loading && hasData && peakDay.tokens > 0 && (
        <Card className="glass border-indigo-500/20 bg-indigo-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-medium">Pic de consommation</p>
              <p className="text-xs text-muted-foreground">
                {new Date(peakDay.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} ·{' '}
                <span className="text-indigo-300 font-medium">{peakDay.tokens.toLocaleString('fr-FR')} tokens</span> ·{' '}
                {peakDay.requests} requête{peakDay.requests > 1 ? 's' : ''}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}
