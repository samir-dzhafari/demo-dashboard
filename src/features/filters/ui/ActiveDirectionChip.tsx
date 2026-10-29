import { X } from 'lucide-react'
import { getDataset } from '@/shared/api/mocks'
import { useFilters } from '../model/useFilters'

/** Shows the service-direction cross-filter (set from the revenue structure) and lets the user clear it. */
export const ActiveDirectionChip = () => {
  const { filters, toggleDirection } = useFilters()
  const direction = getDataset().directions.find((item) => item.id === filters.directions[0])
  if (!direction) return null
  return (
    <button
      type="button"
      onClick={() => toggleDirection(null)}
      className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
    >
      Направление: {direction.name}
      <X size={12} aria-hidden />
      <span className="sr-only">сбросить</span>
    </button>
  )
}
