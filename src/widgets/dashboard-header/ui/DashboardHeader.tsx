import { BranchFilter, ChannelFilter, ComparisonFilter, PeriodFilter } from '@/features/filters'
import { UPDATED_AT } from '@/shared/api/mocks'
import { Badge } from '@/shared/ui'

interface DashboardHeaderProps {
  title: string
  showChannels?: boolean
}

/** "2026-10-28T23:00" → "28.10.2026, 23:00". */
const formatUpdatedAt = (iso: string): string => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}, ${iso.slice(11, 16)}`

/** Attribution model is fixed by the spec: every lead has exactly one channel (last significant). */
const AttributionBadge = () => (
  <span className="inline-block max-w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[13px] leading-5 text-slate-500">
    Атрибуция <span className="font-semibold text-slate-900">Последний значимый</span>
  </span>
)

/** Topbar of every dashboard screen: title, network badge, shared filters and the data freshness stamp. */
export const DashboardHeader = ({ title, showChannels = false }: DashboardHeaderProps) => (
  <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
    <div className="flex min-w-0 max-w-full flex-wrap items-center gap-x-3 gap-y-1">
      <h1 className="min-w-0 break-words text-[22px] font-bold leading-7 text-slate-900">{title}</h1>
      <Badge tone="neutral" className="max-w-full whitespace-normal rounded-xl text-[13px] font-normal">Автомобильный сервисный центр</Badge>
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <PeriodFilter />
      <BranchFilter />
      {showChannels && <ChannelFilter />}
      {showChannels ? <AttributionBadge /> : <ComparisonFilter />}
      <span className="text-xs text-slate-500 sm:ml-2">Обновлено {formatUpdatedAt(UPDATED_AT)}</span>
    </div>
  </header>
)
