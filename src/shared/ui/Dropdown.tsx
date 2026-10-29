import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from './cn'

interface DropdownProps {
  /** Muted caption before the value, e.g. "Период". */
  label: string
  /** Bold current value shown in the trigger. */
  valueText: string
  /** Receives `close` so the panel can close itself after a choice. */
  children: (close: () => void) => ReactNode
  align?: 'left' | 'right'
  panelClassName?: string
}

/** Pill-shaped trigger with a popover panel; the base of `Select` and `MultiSelect`. */
export const Dropdown = ({ label, valueText, children, align = 'left', panelClassName }: DropdownProps) => {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-500 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
      >
        <span>{label}</span>
        <span className="font-semibold text-slate-900">{valueText}</span>
        <ChevronDown size={14} className={cn('text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div
          className={cn(
            'absolute top-full z-30 mt-1.5 min-w-full rounded-xl border border-slate-200 bg-white p-1 shadow-lg',
            align === 'right' ? 'right-0' : 'left-0',
            panelClassName,
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}
