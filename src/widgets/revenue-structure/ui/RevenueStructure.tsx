import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { useFilters } from '@/features/filters'
import { formatMillions, formatPercent } from '@/shared/lib/format'
import { AnimatedNumber, Card, Delta, EmptyState, cn } from '@/shared/ui'
import { useRevenueStructure } from '../model/useRevenueStructure'

/** Donut of revenue by service direction. Clicking a slice or a legend row toggles the direction cross-filter. */
export const RevenueStructure = () => {
  const { slices, total, segmentShare, segmentDelta } = useRevenueStructure()
  const { filters, toggleDirection } = useFilters()
  const activeId = filters.directions[0]
  const isDimmed = (id: string) => activeId !== undefined && activeId !== id

  return (
    <Card title="Структура выручки" subtitle="По направлениям услуг" className="h-full">
      {total === 0 ? (
        <EmptyState />
      ) : (
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex min-h-0 flex-1 items-center justify-center gap-4 sm:justify-between sm:gap-8 sm:px-6 xl:gap-6 xl:px-2">
          <div className="relative aspect-square h-full max-h-[220px] shrink-0 xl:max-h-[170px] min-[1500px]:max-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="revenue"
                  nameKey="name"
                  innerRadius="66%"
                  outerRadius="100%"
                  paddingAngle={1.5}
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                  isAnimationActive={false}
                  onClick={(_, index) => toggleDirection(slices[index]?.id ?? null)}
                  cursor="pointer"
                >
                  {slices.map((slice) => (
                    <Cell key={slice.id} fill={slice.color} fillOpacity={isDimmed(slice.id) ? 0.3 : 1} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span data-testid="structure-total" className="text-[28px] font-bold leading-8 text-slate-900 tabular-nums"><AnimatedNumber value={total} format={formatMillions} /></span>
              <span className="text-xs text-slate-500">млн ₽</span>
            </div>
          </div>
          <ul className="min-w-0 max-w-72 flex-1 text-[13px] sm:w-72">
            {slices.map((slice) => (
              <li key={slice.id}>
                <button
                  type="button"
                  aria-pressed={activeId === slice.id}
                  onClick={() => toggleDirection(slice.id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left hover:bg-slate-50',
                    isDimmed(slice.id) && 'opacity-45',
                    activeId === slice.id && 'bg-slate-50',
                  )}
                >
                  <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: slice.color }} />
                  <span className="min-w-0 flex-1 text-[12px] leading-4 text-slate-700 min-[1500px]:text-[13px]">{slice.name}</span>
                  <span className="font-semibold tabular-nums text-slate-900"><AnimatedNumber value={slice.revenue} format={formatMillions} /></span>
                  <span className="w-9 text-right tabular-nums text-slate-500 min-[1500px]:w-12">{slice.share === null ? '—' : formatPercent(slice.share, 0)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span>Доля пакетов и корп. сегмента</span>
          <span className="flex items-baseline gap-2">
            <span className="text-[13px] font-semibold text-slate-900 tabular-nums">{segmentShare === null ? '—' : formatPercent(segmentShare, 0)}</span>
            {/* Share-type metric: growth is good, so any "higher is better" points metric gives the right tone. */}
            {segmentDelta !== null && <Delta metric="repeatClientsShare" value={segmentDelta} unit="points" />}
          </span>
        </div>
      </div>
      )}
    </Card>
  )
}
