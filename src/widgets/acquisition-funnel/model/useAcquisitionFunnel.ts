import { useMemo } from 'react'
import { useMetricFilters } from '@/features/filters'
import { getDataset } from '@/shared/api/mocks'
import { acquisitionFunnel, type FunnelStage, type FunnelStageKey } from '@/shared/lib/metrics'

export const STAGE_TITLES: Record<FunnelStageKey, string> = {
  visits: 'Визиты на сайт и карты',
  leads: 'Лиды',
  bookings: 'Записи',
  completed: 'Состоялись',
  repeat: 'Повторные',
}

/** Five funnel stages for the period and the selected channels (branches carry no meaning for leads and web visits). */
export const useAcquisitionFunnel = (): FunnelStage[] => {
  const filters = useMetricFilters()
  return useMemo(() => acquisitionFunnel(getDataset(), filters), [filters])
}
