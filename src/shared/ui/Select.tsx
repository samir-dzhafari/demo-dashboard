import { Check } from 'lucide-react'
import { Dropdown } from './Dropdown'
import { cn } from './cn'

export interface SelectOption<T extends string> {
  value: T
  label: string
}

interface SelectProps<T extends string> {
  label: string
  value: T
  options: readonly SelectOption<T>[]
  onChange: (value: T) => void
  /** Text in the trigger; defaults to the label of the selected option. */
  valueText?: string
  align?: 'left' | 'right'
}

export const Select = <T extends string>({ label, value, options, onChange, valueText, align }: SelectProps<T>) => {
  const selected = options.find((option) => option.value === value)
  return (
    <Dropdown label={label} valueText={valueText ?? selected?.label ?? ''} align={align} panelClassName="max-h-72 overflow-y-auto">
      {(close) => (
        <ul role="listbox" className="min-w-40">
          {options.map((option) => (
            <li key={option.value} role="option" aria-selected={option.value === value}>
              <button
                type="button"
                onClick={() => {
                  onChange(option.value)
                  close()
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-left text-[13px] hover:bg-slate-100',
                  option.value === value ? 'font-semibold text-slate-900' : 'text-slate-700',
                )}
              >
                {option.label}
                {option.value === value && <Check size={14} className="text-blue-600" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Dropdown>
  )
}
