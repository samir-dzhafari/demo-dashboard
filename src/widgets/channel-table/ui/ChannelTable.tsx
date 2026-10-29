import type { ReactNode } from 'react'
import { ALL_CHANNELS } from '@/entities/channel'
import { formatPeriodLabel, useFilters } from '@/features/filters'
import { formatMillions, formatNumber, formatPercent } from '@/shared/lib/format'
import { AnimatedNumber, Card, EmptyState, Table, type TableColumn } from '@/shared/ui'
import { useChannelTable, type ChannelRow } from '../model/useChannelTable'

/** ROMI bar scale: a full bar is 700%. */
const BAR_MAX = 700

/** ≥300% blue, 200–299% light blue, below 200% orange; thresholds apply to the rounded number that is shown. */
const romiColor = (romi: number): string => {
  const shown = Math.round(romi)
  return shown >= 300 ? '#2F5BEA' : shown >= 200 ? '#A9B9F5' : '#F59E0B'
}

const RomiCell = ({ romi, withBar = true }: { romi: number | null; withBar?: boolean }) => (
  <div className="flex items-center justify-end gap-3">
    {withBar && (
      <span aria-hidden className="hidden h-1.5 w-10 overflow-hidden sm:block sm:w-16 xl:w-10 min-[1500px]:w-20 rounded-full bg-slate-100">
        {romi !== null && (
          <span className="block h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, (romi / BAR_MAX) * 100))}%`, background: romiColor(romi) }} />
        )}
      </span>
    )}
    <span className="text-right font-semibold tabular-nums sm:w-12">{dash(romi, (value) => `${formatNumber(value)}%`)}</span>
  </div>
)

const dash = (value: number | null, format: (n: number) => string): ReactNode => (value === null ? '—' : <AnimatedNumber value={value} format={format} />)
const fmtInt = (value: number): string => formatNumber(Math.round(value))

/** Columns that give way on phones: the table keeps channel, leads and ROMI. */
const SECONDARY = 'hidden sm:table-cell'

const COLUMNS: TableColumn<ChannelRow>[] = [
  { key: 'name', header: 'Канал', className: 'whitespace-normal sm:whitespace-nowrap', render: (row) => row.name, sortValue: (row) => row.name },
  {
    key: 'budget',
    header: 'Бюджет, млн ₽',
    align: 'right',
    className: SECONDARY,
    render: (row) => dash(row.budget, formatMillions),
    sortValue: (row) => row.budget,
  },
  { key: 'leads', header: 'Лиды', align: 'right', render: (row) => dash(row.leads, fmtInt), sortValue: (row) => row.leads },
  { key: 'cpl', header: 'CPL, ₽', align: 'right', className: SECONDARY, render: (row) => dash(row.cpl, fmtInt), sortValue: (row) => row.cpl ?? -1 },
  {
    key: 'conversion',
    header: 'Конв. в запись',
    align: 'right',
    className: SECONDARY,
    render: (row) => dash(row.bookingConversion, (v) => `${formatNumber(v)}%`),
    sortValue: (row) => row.bookingConversion ?? -1,
  },
  {
    key: 'romi',
    header: 'ROMI',
    align: 'right',
    render: (row) => <RomiCell romi={row.romi} />,
    sortValue: (row) => row.romi ?? -Infinity,
  },
]

/** Channel efficiency. A row click narrows the whole screen to the channel (again — back to all channels). */
export const ChannelTable = () => {
  const { rows, total } = useChannelTable()
  const { filters, setChannels } = useFilters()
  const soleChannel = filters.channels.length === 1 ? filters.channels[0] : undefined
  const isEmpty = total.leads === 0 && total.budget === 0

  return (
    <Card
      title="Эффективность каналов"
      subtitle={`${formatPeriodLabel(filters.period)} · бюджет ${formatMillions(total.budget)} млн ₽`}
      className="h-full"
    >
      {isEmpty ? (
        <EmptyState />
      ) : (
        <Table
          columns={COLUMNS}
          tableClassName="whitespace-nowrap sm:min-w-[520px]"
          rows={rows}
          getRowKey={(row) => row.channelId}
          isRowActive={(row) => row.channelId === soleChannel}
          onRowClick={(row) => setChannels(row.channelId === soleChannel ? ALL_CHANNELS.map((channel) => channel.id) : [row.channelId])}
          footer={
            <tr data-testid="channel-total">
              <td>Итого</td>
              <td className={`text-right ${SECONDARY}`}>{dash(total.budget, formatMillions)}</td>
              <td className="text-right">{dash(total.leads, fmtInt)}</td>
              <td className={`text-right ${SECONDARY}`}>{dash(total.cpl, fmtInt)}</td>
              <td className={`text-right ${SECONDARY}`}>{dash(total.bookingConversion, formatPercent)}</td>
              <td className="text-right"><RomiCell romi={total.romi} withBar={false} /></td>
            </tr>
          }
        />
      )}
    </Card>
  )
}
