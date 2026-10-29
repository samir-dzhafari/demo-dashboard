import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatNumber, formatRub } from '@/shared/lib/format'
import { Card, EmptyState } from '@/shared/ui'
import { useLeadsWeekly, type WeeklyPoint } from '../model/useLeadsWeekly'

const COLORS = { leads: '#2F5BEA', cpl: '#F59E0B' } as const
const AXIS_TICK = { fontSize: 11, fill: '#64748B' } as const

const Legend = () => (
  <ul className="flex items-center gap-4 text-xs text-slate-600">
    <li className="flex items-center gap-1.5"><span className="size-2 rounded-[2px]" style={{ background: COLORS.leads }} />Лиды, шт.</li>
    <li className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: COLORS.cpl }} />CPL, ₽</li>
  </ul>
)

interface TooltipProps {
  active?: boolean
  payload?: Array<{ payload: WeeklyPoint }>
}

const WeekTooltip = ({ active, payload }: TooltipProps) => {
  const point = payload?.[0]?.payload
  if (!active || !point) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-semibold text-slate-900">Неделя с {point.label}</p>
      <p className="flex items-center justify-between gap-4 text-slate-600">
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-[2px]" style={{ background: COLORS.leads }} />Лиды</span>
        <span className="font-medium tabular-nums text-slate-900">{formatNumber(point.leads)}</span>
      </p>
      <p className="flex items-center justify-between gap-4 text-slate-600">
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: COLORS.cpl }} />CPL</span>
        <span className="font-medium tabular-nums text-slate-900">{point.cpl === null ? '—' : formatRub(point.cpl)}</span>
      </p>
    </div>
  )
}

/** Bars — leads per week (left axis), line — CPL in rubles (right axis). */
export const LeadsWeekly = () => {
  const points = useLeadsWeekly()
  const isEmpty = points.every((point) => point.leads === 0)
  return (
    <Card title="Лиды по неделям и стоимость лида" subtitle="Последние 16 недель" action={<Legend />} className="h-full">
      {isEmpty ? (
        <EmptyState />
      ) : (
        <div className="relative h-full min-h-0" data-testid="leads-weekly-chart">
          <div className="absolute inset-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={points} margin={{ top: 8, right: 4, bottom: 0, left: -8 }}>
                <CartesianGrid vertical={false} stroke="#E8ECF4" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={AXIS_TICK} minTickGap={6} />
                <YAxis
                  yAxisId="leads"
                  domain={[0, 'auto']}
                  tickCount={5}
                  axisLine={false}
                  tickLine={false}
                  tick={AXIS_TICK}
                  tickFormatter={(value: number) => formatNumber(value)}
                  width={48}
                />
                <YAxis
                  yAxisId="cpl"
                  orientation="right"
                  domain={[0, 'auto']}
                  tickCount={5}
                  axisLine={false}
                  tickLine={false}
                  tick={{ ...AXIS_TICK, fill: '#D97706' }}
                  tickFormatter={(value: number) => formatNumber(value)}
                  width={40}
                />
                <Tooltip content={<WeekTooltip />} cursor={{ fill: 'rgba(47,91,234,0.06)' }} />
                <Bar yAxisId="leads" dataKey="leads" fill={COLORS.leads} radius={[3, 3, 0, 0]} maxBarSize={26} isAnimationActive={false} />
                <Line
                  yAxisId="cpl"
                  type="monotone"
                  dataKey="cpl"
                  stroke={COLORS.cpl}
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#fff', stroke: COLORS.cpl, strokeWidth: 1.5 }}
                  activeDot={{ r: 4, fill: COLORS.cpl }}
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
