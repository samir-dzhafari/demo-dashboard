import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatNumber } from '@/shared/lib/format'
import { Card, EmptyState } from '@/shared/ui'
import { useRevenueTrend, type RevenueTrendPoint } from '../model/useRevenueTrend'

const COLORS = { fact: '#2F5BEA', previousYear: '#B8C0D4', plan: '#F59E0B' } as const

const Legend = ({ year, hasPlan }: { year: number; hasPlan: boolean }) => (
  <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
    <li className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: COLORS.fact }} />{year} факт</li>
    <li className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: COLORS.previousYear }} />{year - 1}</li>
    {hasPlan && <li className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: COLORS.plan }} />План {year}</li>}
  </ul>
)

interface TooltipProps {
  active?: boolean
  payload?: Array<{ payload: RevenueTrendPoint }>
  year: number
}

const TrendTooltip = ({ active, payload, year }: TooltipProps) => {
  const point = payload?.[0]?.payload
  if (!active || !point) return null
  const rows: Array<[string, number | null, string]> = [
    [`${year} факт`, point.fact, COLORS.fact],
    [String(year - 1), point.previousYear, COLORS.previousYear],
    [`План ${year}`, point.plan, COLORS.plan],
  ]
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-semibold text-slate-900">{point.month}</p>
      {rows.map(([label, value, color]) =>
        value === null ? null : (
          <p key={label} className="flex items-center justify-between gap-4 text-slate-600">
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: color }} />{label}</span>
            <span className="font-medium tabular-nums text-slate-900">{formatNumber(value, 1)} млн ₽</span>
          </p>
        ),
      )}
    </div>
  )
}

/** Monthly revenue: fact of the current year (breaks after the period end), previous year and plan. */
export const RevenueTrend = () => {
  const { year, points, hasPlan } = useRevenueTrend()
  const isEmpty = points.every((point) => !point.fact && !point.previousYear)
  return (
    <Card
      title="Выручка по месяцам, млн ₽"
      subtitle={hasPlan ? `Факт ${year} vs ${year - 1} и план года` : `Факт ${year} vs ${year - 1} · план не делится по направлениям`}
      action={<Legend year={year} hasPlan={hasPlan} />}
      className="h-full"
    >
      {isEmpty ? (
        <EmptyState />
      ) : (
      <div className="relative h-full min-h-0" data-testid="revenue-trend-chart">
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
              <defs>
                <linearGradient id="revenue-fact-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.fact} stopOpacity={0.14} />
                  <stop offset="100%" stopColor={COLORS.fact} stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#E8ECF4" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis
                domain={[0, 'auto']}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#64748B' }}
                tickFormatter={(value: number) => formatNumber(value)}
                width={44}
              />
              <Tooltip content={<TrendTooltip year={year} />} cursor={{ stroke: '#CBD5E1' }} />
              <Line type="monotone" dataKey="previousYear" stroke={COLORS.previousYear} strokeWidth={2} dot={false} isAnimationActive={false} />
              {hasPlan && (
                <Line type="monotone" dataKey="plan" stroke={COLORS.plan} strokeWidth={1.5} strokeDasharray="4 3" dot={false} isAnimationActive={false} />
              )}
              <Area
                type="monotone"
                dataKey="fact"
                stroke={COLORS.fact}
                strokeWidth={2}
                fill="url(#revenue-fact-fill)"
                connectNulls={false}
                dot={{ r: 3, fill: '#fff', stroke: COLORS.fact, strokeWidth: 1.5 }}
                activeDot={{ r: 4, fill: COLORS.fact }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      )}
    </Card>
  )
}
