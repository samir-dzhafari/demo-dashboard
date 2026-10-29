import { ArrowDown, ArrowUp } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { cn } from './cn'

export interface TableColumn<Row> {
  key: string
  header: ReactNode
  render: (row: Row) => ReactNode
  align?: 'left' | 'right'
  /** Makes the column sortable by this value. */
  sortValue?: (row: Row) => number | string
  className?: string
}

interface TableProps<Row> {
  columns: readonly TableColumn<Row>[]
  rows: readonly Row[]
  getRowKey: (row: Row) => string
  /** Total row rendered in `<tfoot>`; usually `<tr>` with `<td>` cells. */
  footer?: ReactNode
  /** Makes rows clickable (mouse and keyboard). */
  onRowClick?: (row: Row) => void
  /** Highlights the row, e.g. the one currently used as a filter. */
  isRowActive?: (row: Row) => boolean
  /** Min width of the table: below it the wrapper scrolls horizontally instead of squeezing columns. */
  minWidth?: number | string
  /** Max height of the scroll area; the header stays sticky inside it. */
  maxHeight?: number | string
  className?: string
}

type SortState = { key: string; direction: 'asc' | 'desc' } | null

export const Table = <Row,>({ columns, rows, getRowKey, footer, onRowClick, isRowActive, maxHeight, minWidth, className }: TableProps<Row>) => {
  const [sort, setSort] = useState<SortState>(null)

  const sortedRows = useMemo(() => {
    const column = sort && columns.find((item) => item.key === sort.key)
    if (!sort || !column?.sortValue) return rows
    const getValue = column.sortValue
    const factor = sort.direction === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const left = getValue(a)
      const right = getValue(b)
      if (typeof left === 'number' && typeof right === 'number') return (left - right) * factor
      return String(left).localeCompare(String(right), 'ru') * factor
    })
  }, [rows, columns, sort])

  const toggleSort = (key: string) =>
    setSort((current) => {
      if (current?.key !== key) return { key, direction: 'desc' }
      return current.direction === 'desc' ? { key, direction: 'asc' } : null
    })

  return (
    <div className={cn('overflow-auto', className)} style={{ maxHeight }}>
      <table className="w-full border-collapse whitespace-nowrap text-[13px]" style={{ minWidth }}>
        <thead>
          <tr>
            {columns.map((column) => {
              const active = sort?.key === column.key
              return (
                <th
                  key={column.key}
                  aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined}
                  className={cn(
                    'sticky top-0 z-10 border-b border-slate-200 bg-white px-2 py-2 text-xs font-normal text-slate-500',
                    column.align === 'right' ? 'text-right' : 'text-left',
                    column.className,
                  )}
                >
                  {column.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      className={cn('inline-flex items-center gap-1 hover:text-slate-900', column.align === 'right' && 'flex-row-reverse')}
                    >
                      {column.header}
                      {active && (sort.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => (
            <tr
              key={getRowKey(row)}
              className={cn(
                'border-b border-slate-100 last:border-b-0',
                onRowClick && 'cursor-pointer hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-500',
                isRowActive?.(row) && 'bg-blue-50/60',
              )}
              tabIndex={onRowClick ? 0 : undefined}
              onClick={onRowClick && (() => onRowClick(row))}
              onKeyDown={
                onRowClick &&
                ((event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onRowClick(row)
                  }
                })
              }
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn('px-2 py-2.5 text-slate-800', column.align === 'right' ? 'text-right tabular-nums' : 'text-left', column.className)}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer && <tfoot className="[&_td]:border-t [&_td]:border-slate-200 [&_td]:px-2 [&_td]:py-2.5 [&_td]:font-semibold [&_td]:tabular-nums">{footer}</tfoot>}
      </table>
    </div>
  )
}
