import { Select, type SelectOption } from '@/shared/ui'
import type { ComparisonBase } from '../model/filtersSlice'
import { useFilters } from '../model/useFilters'

const OPTIONS: SelectOption<ComparisonBase>[] = [
  { value: 'yoy', label: 'С прошлым годом' },
  { value: 'plan', label: 'С планом' },
]

export const ComparisonFilter = () => {
  const { filters, setComparison } = useFilters()
  return (
    <Select
      label="Сравнение"
      value={filters.comparison}
      options={OPTIONS}
      onChange={setComparison}
      valueText={filters.comparison === 'yoy' ? String(Number(filters.period.to.slice(0, 4)) - 1) : 'План'}
      align="right"
    />
  )
}
