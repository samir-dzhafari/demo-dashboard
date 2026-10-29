import { useMemo } from 'react'
import { useMetricFilters } from '@/features/filters'
import { getDataset } from '@/shared/api/mocks'
import { channelEfficiency, type ChannelStats } from '@/shared/lib/metrics'

export interface ChannelRow extends ChannelStats {
  name: string
}

/** Rows for the selected channels plus the total row computed from raw data (not by summing rows). */
export const useChannelTable = (): { rows: ChannelRow[]; total: ChannelStats } => {
  const filters = useMetricFilters()
  return useMemo(() => {
    const dataset = getDataset()
    const { rows, total } = channelEfficiency(dataset, filters)
    return {
      rows: rows.map((row) => ({ ...row, name: dataset.channels.find((channel) => channel.id === row.channelId)?.name ?? row.channelId })),
      total,
    }
  }, [filters])
}
