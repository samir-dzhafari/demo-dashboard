import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatNumber, formatPercent, formatPercentPoints, monthLowerShort, monthPrepositional } from '@/shared/lib/format'
import { getDeltaTone } from '@/shared/lib/metrics'
import { AnimatedNumber, Card, EmptyState, cn } from '@/shared/ui'
import { useBookingSources, type SourcesPoint } from '../model/useBookingSources'

const SERIES = [
  { key: 'onlineK', label: 'Онлайн', color: '#2F5BEA', field: 'online' },
  { key: 'messengerK', label: 'Мессенджеры', color: '#14B8A6', field: 'messenger' },
  { key: 'phoneK', label: 'Телефон', color: '#B8C0D4', field: 'phone' },
] as const

const AXIS_TICK = { fontSize: 11, fill: '#64748B' } as const

const Legend = () => (
  <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
    {SERIES.map((series) => (
      <li key={series.key} className="flex items-center gap-1.5">
        <span className="size-2 rounded-[2px]" style={{ background: series.color }} />
        {series.label}
      </li>
    ))}
  </ul>
)

interface TooltipProps {
  active?: boolean
  payload?: Array<{ payload: SourcesPoint }>
}

const SourcesTooltip = ({ active, payload }: TooltipProps) => {
  const point = payload?.[0]?.payload
  if (!active || !point) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-semibold text-slate-900">{point.label} · {formatNumber(point.total)} записей</p>
      {SERIES.map((series) => (
        <p key={series.key} className="flex items-center justify-between gap-4 text-slate-600">
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-[2px]" style={{ background: series.color }} />{series.label}</span>
          <span className="font-medium tabular-nums text-slate-900">{formatNumber(point[series.field])}</span>
        </p>
      ))}
    </div>
  )
}

const TONE_CLASS = { good: 'text-emerald-600', bad: 'text-red-500', neutral: 'text-slate-500' } as const

/** Stacked columns of new bookings by method, with the online share of the last month underneath. */
export const BookingSources = () => {
  const { points, lastShare, shareDelta } = useBookingSources()
  const first = points[0]
  const last = points[points.length - 1]
  const isEmpty = points.every((point) => point.total === 0)
  const tone = shareDelta === null ? 'neutral' : getDeltaTone('onlineBookingShare', shareDelta)

  return (
    <Card
      title="Источники записи"
      subtitle={first && last ? `Новые записи, тыс. · ${monthLowerShort(first.month)} – ${monthLowerShort(last.month)}` : undefined}
      action={<Legend />}
      className="h-full"
    >
      {isEmpty || !last ? (
        <EmptyState />
      ) : (
        <div className="flex h-full min-h-0 flex-col gap-2">
          <div className="relative min-h-0 flex-1" data-testid="booking-sources-chart">
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={points} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
                  <CartesianGrid vertical={false} stroke="#E8ECF4" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={AXIS_TICK} interval={0} />
                  <YAxis
                    domain={[0, 'auto']}
                    tickCount={5}
                    axisLine={false}
                    tickLine={false}
                    tick={AXIS_TICK}
                    tickFormatter={(value: number) => formatNumber(value, 1)}
                    width={44}
                  />
                  <Tooltip content={<SourcesTooltip />} cursor={{ fill: 'rgba(47,91,234,0.06)' }} />
                  {SERIES.map((series, index) => (
                    <Bar
                      key={series.key}
                      dataKey={series.key}
                      stackId="sources"
                      fill={series.color}
                      radius={index === SERIES.length - 1 ? [3, 3, 0, 0] : 0}
                      maxBarSize={44}
                      isAnimationActive={false}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <p className="flex items-baseline justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500" data-testid="online-share">
            <span>Доля самостоятельной онлайн-записи в {monthPrepositional(last.month)}</span>
            <span className="flex items-baseline gap-1.5 font-semibold">
              <span className="text-emerald-600">{lastShare === null ? '—' : <AnimatedNumber value={lastShare} format={(value) => formatPercent(value, 0)} />}</span>
              {shareDelta !== null && (
                <span className={cn('inline-flex items-baseline gap-1', TONE_CLASS[tone])}>
                  <span aria-hidden className="text-[9px]">{shareDelta === 0 ? '' : shareDelta > 0 ? '▲' : '▼'}</span>
                  {formatPercentPoints(Math.abs(shareDelta), 0)} с {monthLowerShort(first!.month)}
                </span>
              )}
            </span>
          </p>
        </div>
      )}
    </Card>
  )
}
