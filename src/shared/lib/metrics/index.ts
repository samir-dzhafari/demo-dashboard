export { branchPerformance, byMonth, capacityHeatmap, revenueByDirection } from './breakdowns'
export type { BranchStats, DirectionShare, HeatmapCell, MonthlyPoint } from './breakdowns'
export { idPredicate, sliceByDate } from './filters'
export type { MetricFilters } from './filters'
export {
  TOTAL_CHANNEL_ID,
  acquisitionFunnel,
  bookingConversion,
  channelEfficiency,
  costPerLead,
  customerAcquisitionCost,
  leadsCount,
  marketingBudget,
  newClientsCount,
  newClientsRevenue,
  romi,
  uniqueLeads,
} from './marketing'
export type { ChannelStats, FunnelStage, FunnelStageKey } from './marketing'
export { bookingSourcesByMonth, leadsByWeek, WEEKS_SHOWN, MONTHS_SHOWN } from './trends'
export type { BookingSourcesPoint, WeeklyLeadsPoint } from './trends'
export { METRIC_META, computeDelta, getDeltaTone, isGoodDelta } from './metricMeta'
export type { DeltaTone, MetricKey } from './metricMeta'
export { METRIC_FUNCTIONS, compareWithPreviousYear, computeMetric, computeMetricSeries, sparklineSeries } from './registry'
export type { MetricComparison, SparklinePoint } from './registry'
export {
  averageCheck,
  cancellationRate,
  capacityLoad,
  onlineBookingShare,
  planCompletion,
  planRevenue,
  repeatClientsShare,
  revenue,
  servicesCount,
} from './sales'
