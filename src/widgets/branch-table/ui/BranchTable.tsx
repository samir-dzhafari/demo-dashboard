import { formatNumber, formatPercent } from '@/shared/lib/format'
import { formatPeriodLabel, useFilters } from '@/features/filters'
import { AnimatedNumber, Badge, Card, EmptyState, Table, type BadgeTone, type TableColumn } from '@/shared/ui'
import { useBranchTable, type BranchRow } from '../model/useBranchTable'

/** ≥100% green, 95–99% yellow, below 95% red. Thresholds apply to the rounded number the badge shows. */
const planTone = (completion: number): BadgeTone => {
  const shown = Math.round(completion)
  return shown >= 100 ? 'green' : shown >= 95 ? 'yellow' : 'red'
}

const COLUMNS: TableColumn<BranchRow>[] = [
  { key: 'name', header: 'Филиал', render: (row) => row.name, sortValue: (row) => row.name },
  {
    key: 'load',
    header: 'Загрузка',
    align: 'right',
    render: (row) => (row.capacityLoad === null ? '—' : <AnimatedNumber value={row.capacityLoad} format={formatPercent} />),
    sortValue: (row) => row.capacityLoad ?? -1,
  },
  {
    key: 'check',
    header: 'Ср. чек, ₽',
    align: 'right',
    render: (row) => (row.averageCheck === null ? '—' : <AnimatedNumber value={row.averageCheck} format={(value) => formatNumber(Math.round(value))} />),
    sortValue: (row) => row.averageCheck ?? -1,
  },
  {
    key: 'cancel',
    header: 'Отмены',
    align: 'right',
    render: (row) => (row.cancellationRate === null ? '—' : <AnimatedNumber value={row.cancellationRate} format={formatPercent} />),
    sortValue: (row) => row.cancellationRate ?? -1,
  },
  {
    key: 'plan',
    header: 'План',
    align: 'right',
    render: (row) =>
      row.planCompletion === null ? (
        '—'
      ) : (
        <Badge tone={planTone(row.planCompletion)} className="tabular-nums">{Math.round(row.planCompletion)}%</Badge>
      ),
    sortValue: (row) => row.planCompletion ?? -1,
  },
]

/** Branch indicators table. A click on a row narrows the screen to the branch (again — back to all). */
export const BranchTable = () => {
  const rows = useBranchTable()
  const { filters, setBranches, selectAllBranches } = useFilters()
  const soleBranch = filters.branches.length === 1 ? filters.branches[0] : undefined

  return (
    <Card title="Показатели филиалов" subtitle={formatPeriodLabel(filters.period)} className="h-full">
      {rows.every((row) => row.servicesCount === 0) ? (
        <EmptyState />
      ) : (
        <Table
          columns={COLUMNS}
          rows={rows}
          getRowKey={(row) => row.branchId}
          isRowActive={(row) => row.branchId === soleBranch}
          onRowClick={(row) => (row.branchId === soleBranch ? selectAllBranches() : setBranches([row.branchId]))}
        />
      )}
    </Card>
  )
}
