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
    <div className="grid auto-rows-[340px] grid-cols-1 gap-3 xl:h-[330px] xl:auto-rows-auto xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <RevenueTrend />
      <RevenueStructure />
    </div>
    <div className="grid auto-rows-[400px] grid-cols-1 gap-3 xl:h-[400px] xl:auto-rows-auto xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.9fr)_minmax(0,1.05fr)]">
      <BranchPlanFact />
      <LoadHeatmap />
      <BranchTable />
    </div>
  </div>
)
