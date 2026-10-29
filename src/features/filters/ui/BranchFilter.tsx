import { ALL_BRANCHES } from '@/entities/branch'
import { MultiSelect } from '@/shared/ui'
import { useFilters } from '../model/useFilters'

const OPTIONS = ALL_BRANCHES.map((branch) => ({ value: branch.id, label: branch.name }))

export const BranchFilter = () => {
  const { filters, setBranches } = useFilters()
  return <MultiSelect label="Филиалы" options={OPTIONS} selected={filters.branches} onChange={setBranches} allText={`Все (${OPTIONS.length})`} />
}
