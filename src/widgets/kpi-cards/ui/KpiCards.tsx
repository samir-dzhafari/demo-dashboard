import { formatMillions, formatNumber } from '@/shared/lib/format'
import { AnimatedNumber, Delta, Sparkline, Tooltip } from '@/shared/ui'
import { CAPACITY_TARGET, useKpiCards, type KpiKey, type KpiView } from '../model/useKpiCards'

const formatValue = (key: KpiKey, value: number): { text: string; unit: string | null } => {
  switch (key) {
    case 'revenue':
      return { text: formatMillions(value), unit: 'млн ₽' }
    case 'servicesCount':
      return { text: formatNumber(value), unit: null }
    case 'averageCheck':
      return { text: formatNumber(Math.round(value)), unit: '₽' }
    case 'capacityLoad':
    case 'cancellationRate':
      return { text: formatNumber(value, 1), unit: '%' }
  }
}

const formatKpi = (key: KpiKey, value: number): string => {
  const { text, unit } = formatValue(key, value)
  return unit ? `${text} ${unit}` : text
}

const HINTS: Record<KpiKey, string> = {
  revenue: 'Оплаты за оказанные услуги минус возвраты',
  servicesCount: 'Записи со статусом «Состоялась»',
  averageCheck: 'Выручка ÷ оказано услуг',
  capacityLoad: 'Занятые слоты ÷ доступные слоты',
  cancellationRate: '(Отмены + неявки) ÷ все записи. Снижение — хорошо',
}

const KpiCard = ({ kpi, tooltipAlign }: { kpi: KpiView; tooltipAlign: 'start' | 'end' }) => {
  const formatted = kpi.value === null ? null : formatValue(kpi.key, kpi.value)
  return (
    <article data-testid={`kpi-${kpi.key}`} className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
      <div className="min-w-0 shrink-0">
        <h3 className="text-xs text-slate-500">
          <Tooltip content={HINTS[kpi.key]} side="bottom" align={tooltipAlign} wrap>
            <span tabIndex={0} className="cursor-help rounded-sm">{kpi.title}</span>
          </Tooltip>
        </h3>
        <p className="mt-0.5 flex items-baseline gap-1 whitespace-nowrap">
          <span data-testid="kpi-value" className="text-[28px] font-bold leading-9 text-slate-900 tabular-nums">
            {kpi.value === null ? '—' : <AnimatedNumber value={kpi.value} format={(value) => formatValue(kpi.key, value).text} />}
          </span>
          {formatted?.unit && <span className="text-[13px] font-medium text-slate-500">{formatted.unit}</span>}
        </p>
        <p className="mt-0.5 flex items-baseline gap-2 whitespace-nowrap text-xs">
          {kpi.delta === null ? <span className="text-slate-400">нет данных для сравнения</span> : <Delta metric={kpi.key} value={kpi.delta} suffix={kpi.baseLabel} />}
          {kpi.key === 'capacityLoad' && <span className="text-slate-500">цель {CAPACITY_TARGET}%</span>}
        </p>
      </div>
      <div className="w-[42%] min-w-0 max-w-[150px]">
        <Sparkline data={kpi.spark} tone={kpi.sparkTone} height={44} formatValue={(value) => formatKpi(kpi.key, value)} />
      </div>
    </article>
  )
}

/** Row of five KPI cards: revenue, services, average check, capacity load, cancellations. Reacts to all store filters. */
export const KpiCards = () => {
  const kpis = useKpiCards()
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {kpis.map((kpi, index) => (
        <KpiCard key={kpi.key} kpi={kpi} tooltipAlign={index < 3 ? 'start' : 'end'} />
      ))}
    </div>
  )
}
