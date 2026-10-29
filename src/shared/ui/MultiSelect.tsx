import { Dropdown } from './Dropdown'
import type { SelectOption } from './Select'

interface MultiSelectProps<T extends string> {
  label: string
  options: readonly SelectOption<T>[]
  selected: readonly T[]
  onChange: (selected: T[]) => void
  /** Value text when everything is selected, e.g. "Все (7)". Defaults to "Все (N)". */
  allText?: string
  align?: 'left' | 'right'
}

export const MultiSelect = <T extends string>({ label, options, selected, onChange, allText, align }: MultiSelectProps<T>) => {
  const allSelected = selected.length === options.length
  const valueText = allSelected
    ? (allText ?? `Все (${options.length})`)
    : selected.length === 1
      ? (options.find((option) => option.value === selected[0])?.label ?? '1')
      : `${selected.length} из ${options.length}`

  const toggle = (value: T) =>
    onChange(selected.includes(value) ? selected.filter((item) => item !== value) : options.map((o) => o.value).filter((v) => v === value || selected.includes(v)))

  return (
    <Dropdown label={label} valueText={valueText} align={align} panelClassName="max-h-80 min-w-56 overflow-y-auto">
      {() => (
        <div role="listbox" aria-multiselectable="true">
          <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-slate-900 hover:bg-slate-100">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() => onChange(options.map((option) => option.value))}
              className="size-4 accent-blue-600"
            />
            Выбрать все
          </label>
          <div className="my-1 h-px bg-slate-100" />
          {options.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] text-slate-700 hover:bg-slate-100"
            >
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={() => toggle(option.value)}
                className="size-4 accent-blue-600"
              />
              {option.label}
            </label>
          ))}
        </div>
      )}
    </Dropdown>
  )
}
