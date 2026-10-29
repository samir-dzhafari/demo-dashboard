import type { ReactNode } from 'react'
import { cn } from './cn'

type Side = 'top' | 'bottom' | 'right'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  side?: Side
  /** Horizontal anchor for top/bottom tooltips: `start`/`end` keep the tooltip inside the screen when the trigger sits at an edge. */
  align?: 'center' | 'start' | 'end'
  /** Wraps long text into a narrow box instead of one line. */
  wrap?: boolean
  className?: string
}

const SIDES: Record<Side, string> = {
  top: 'bottom-full left-1/2 mb-1.5 -translate-x-1/2',
  bottom: 'top-full left-1/2 mt-1.5 -translate-x-1/2',
  right: 'left-full top-1/2 ml-2 -translate-y-1/2',
}

const EDGE_SIDES: Record<'start' | 'end', Record<'top' | 'bottom', string>> = {
  start: { top: 'bottom-full left-0 mb-1.5', bottom: 'top-full left-0 mt-1.5' },
  end: { top: 'bottom-full right-0 mb-1.5', bottom: 'top-full right-0 mt-1.5' },
}

/** CSS-only tooltip: shown on hover and keyboard focus of the wrapped element. */
export const Tooltip = ({ content, children, side = 'top', align = 'center', wrap = false, className }: TooltipProps) => (
  <span className={cn('group/tooltip relative inline-flex', className)}>
    {children}
    <span
      role="tooltip"
      className={cn(
        'pointer-events-none absolute z-40 rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white hidden shadow-md group-hover/tooltip:block group-focus-within/tooltip:block',
        align !== 'center' && side !== 'right' ? EDGE_SIDES[align][side] : SIDES[side],
        wrap ? 'w-max max-w-60 whitespace-normal' : 'whitespace-nowrap',
      )}
    >
      {content}
    </span>
  </span>
)
