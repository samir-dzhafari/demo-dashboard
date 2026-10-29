import { ActiveDirectionChip } from '@/features/filters'
import { BranchPlanFact } from '@/widgets/branch-plan-fact'
import { BranchTable } from '@/widgets/branch-table'
import { DashboardHeader } from '@/widgets/dashboard-header'
import { KpiCards } from '@/widgets/kpi-cards'
import { LoadHeatmap } from '@/widgets/load-heatmap'
import { RevenueStructure } from '@/widgets/revenue-structure'
import { RevenueTrend } from '@/widgets/revenue-trend'

/** Management dashboard "Операционная сводка": six rows of widgets driven by the shared filters store. */
export const OperationsPage = () => (
  <div className="flex flex-col gap-3">
    <DashboardHeader title="Операционная сводка" />
    <ActiveDirectionChip />
    <KpiCards />
    {/* One 10-column grid for both rows: 6/4 above and 3/3/4 below, so the column edges line up. */}
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-10 xl:grid-rows-[330px_400px]">
      <div className="h-[340px] min-w-0 xl:col-span-6 xl:h-auto">
        <RevenueTrend />
      </div>
      <div className="h-[340px] min-w-0 xl:col-span-4 xl:h-auto">
        <RevenueStructure />
      </div>
      <div className="h-[400px] min-w-0 xl:col-span-3 xl:h-auto">
        <BranchPlanFact />
      </div>
      <div className="h-[400px] min-w-0 xl:col-span-3 xl:h-auto">
        <LoadHeatmap />
      </div>
      <div className="h-[400px] min-w-0 xl:col-span-4 xl:h-auto">
        <BranchTable />
      </div>
    </div>
  </div>
)
