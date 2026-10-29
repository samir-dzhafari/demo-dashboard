import { getDataset } from '@/shared/api/mocks'
import {
  acquisitionFunnel,
  branchPerformance,
  channelEfficiency,
  compareWithPreviousYear,
  revenueByDirection,
  type MetricKey,
} from '@/shared/lib/metrics'
import { formatDeltaPercent, formatMillions, formatNumber, formatPercent } from '@/shared/lib/format'

const dataset = getDataset()
const period = { from: dataset.meta.to.slice(0, 4) + '-01-01', to: dataset.meta.to }
const name = (list: Array<{ id: string; name: string }>, id: string) => list.find((item) => item.id === id)?.name ?? id

console.log(`Period ${period.from} … ${period.to}`)
const keys: MetricKey[] = [
  'revenue', 'servicesCount', 'averageCheck', 'capacityLoad', 'cancellationRate', 'planCompletion', 'leads',
  'bookingConversion', 'cpl', 'cac', 'romi', 'repeatClientsShare', 'onlineBookingShare',
]
keys.forEach((key) => {
  const { value, delta, tone } = compareWithPreviousYear(dataset, key, period)
  console.log(key.padEnd(20), formatNumber(value ?? NaN, 1).padStart(14), delta === null ? '' : formatDeltaPercent(delta), tone)
})
console.log('\nBranches')
branchPerformance(dataset, period).forEach((row) =>
  console.log(name(dataset.branches, row.branchId).padEnd(12), formatMillions(row.revenue), formatPercent(row.capacityLoad ?? 0, 0), formatPercent(row.planCompletion ?? 0, 0)),
)
console.log('\nDirections')
revenueByDirection(dataset, period).forEach((row) => console.log(name(dataset.directions, row.directionId).padEnd(20), formatMillions(row.revenue), formatPercent(row.share ?? 0, 0)))
console.log('\nChannels')
const { rows, total } = channelEfficiency(dataset, period)
;[...rows, total].forEach((row) =>
  console.log(name(dataset.channels, row.channelId).padEnd(24), formatMillions(row.budget), formatNumber(row.leads), formatNumber(row.cpl ?? 0), formatPercent(row.bookingConversion ?? 0, 0), formatPercent(row.romi ?? 0, 0)),
)
console.log('\nFunnel', acquisitionFunnel(dataset, period).map((s) => `${s.key}:${formatNumber(s.count)}${s.conversionFromPrevious === null ? '' : `(${formatPercent(s.conversionFromPrevious)})`}`).join('  '))
