import { ActiveChannelChip } from '@/features/filters'
import { AcquisitionFunnel } from '@/widgets/acquisition-funnel'
import { BookingSources } from '@/widgets/booking-sources'
import { ChannelTable } from '@/widgets/channel-table'
import { DashboardHeader } from '@/widgets/dashboard-header'
import { LeadsWeekly } from '@/widgets/leads-weekly'
import { MarketingKpi } from '@/widgets/marketing-kpi'

/** Marketing dashboard "Маркетинг и продажи": KPI row, funnel + weekly chart, channel table + booking sources. */
export const MarketingPage = () => (
  <div className="flex flex-col gap-3">
    <DashboardHeader title="Маркетинг и продажи" showChannels />
    <ActiveChannelChip />
    <MarketingKpi />
    <div className="grid grid-cols-1 grid-rows-[auto_320px] gap-3 xl:h-[310px] xl:grid-rows-none xl:grid-cols-[minmax(0,1fr)_minmax(0,1.9fr)]">
      <AcquisitionFunnel />
      <LeadsWeekly />
    </div>
    <div className="grid auto-rows-[minmax(340px,auto)] grid-cols-1 gap-3 xl:h-[340px] xl:auto-rows-auto xl:grid-cols-[minmax(0,1.42fr)_minmax(0,1fr)]">
      <ChannelTable />
      <BookingSources />
    </div>
  </div>
)
