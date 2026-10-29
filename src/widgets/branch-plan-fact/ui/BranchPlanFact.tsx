import { useFilters } from '@/features/filters'
import { formatDeltaPercent, formatNumber } from '@/shared/lib/format'
import { AnimatedNumber, Card, EmptyState, cn } from '@/shared/ui'
import { useBranchPlanFact } from '../model/useBranchPlanFact'

/** Revenue bars per branch with a plan marker. A click narrows the whole screen to the branch (again — back to all). */
export const BranchPlanFact = () => {
  const { rows, max } = useBranchPlanFact()
  const { filters, setBranches, selectAllBranches } = useFilters()
  const isSingle = filters.branches.length === 1

  const toggle = (branchId: string) => (isSingle && filters.branches[0] === branchId ? selectAllBranches() : setBranches([branchId]))

  return (
    <Card title="План / факт по филиалам" subtitle="Выручка, млн ₽ · черта — план периода" className="h-full">
      {max === 0 ? (
        <EmptyState />
      ) : (
      <ul className="flex h-full flex-col justify-between">
        {rows.map((row) => (
          <li key={row.branchId}>
            <button
              type="button"
              data-testid={`planfact-row-${row.branchId}`}
              aria-pressed={isSingle && filters.branches[0] === row.branchId}
              title={isSingle ? 'Показать все филиалы' : `Показать только «${row.name}»`}
              onClick={() => toggle(row.branchId)}
              className="grid w-full grid-cols-[88px_1fr_44px_52px] items-center gap-2 rounded-md py-0.5 text-left text-[13px] hover:bg-slate-50"
            >
              <span className="truncate text-slate-800">{row.name}</span>
              <span className="relative block h-8 rounded-md bg-slate-100">
                <span
                  className={cn('absolute inset-y-0 left-0 rounded-md', row.met ? 'bg-[#2F5BEA]' : 'bg-[#9DB1F5]')}
                  style={{ width: `${(row.revenue / max) * 100}%` }}
                />
                <span aria-hidden className="absolute -inset-y-1 w-0.5 rounded bg-slate-900" style={{ left: `${(row.plan / max) * 100}%` }} />
              </span>
              <span className="text-right font-semibold tabular-nums text-slate-900"><AnimatedNumber value={row.revenue} format={(value) => formatNumber(value, 1)} /></span>
              <span
                className={cn(
                  'text-right text-xs font-semibold tabular-nums',
                  row.deviation === null ? 'text-slate-400' : row.deviation >= 0 ? 'text-emerald-600' : 'text-red-500',
                )}
              >
                {row.deviation === null ? '—' : formatDeltaPercent(row.deviation)}
              </span>
            </button>
          </li>
        ))}
      </ul>
      )}
    </Card>
  )
}
