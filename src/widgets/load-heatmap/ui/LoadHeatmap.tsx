import { formatPercent } from '@/shared/lib/format'
import { Card, Tooltip } from '@/shared/ui'
import { WEEKDAYS, useLoadHeatmap } from '../model/useLoadHeatmap'

const SCALE_MIN = 30
const SCALE_MAX = 100
const LIGHT = [219, 228, 255] as const
const DARK = [47, 91, 234] as const

/** Light blue at 30% and below, saturated blue at 100%. */
const cellColor = (load: number | null): string => {
  if (load === null) return '#F1F5F9'
  const t = Math.min(1, Math.max(0, (load - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)))
  const [r, g, b] = LIGHT.map((from, index) => Math.round(from + (DARK[index] as number - from) * t))
  return `rgb(${r}, ${g}, ${b})`
}

const pad = (hour: number): string => `${String(hour).padStart(2, '0')}:00`

/** Weekday × hour grid of slot load over the last 8 weeks (independent of the period filter). */
export const LoadHeatmap = () => {
  const rows = useLoadHeatmap()
  const hours = rows[0]?.map((cell) => cell.hour) ?? []
  const columns = `20px repeat(${hours.length}, minmax(0, 1fr))`

  return (
    <Card title="Загрузка по дням и часам" subtitle="Средняя загрузка слотов, % · последние 8 недель" className="h-full">
      <div className="flex h-full min-h-0 flex-col gap-1.5" data-testid="load-heatmap">
        <div className="grid min-h-0 flex-1 gap-[3px]" style={{ gridTemplateColumns: columns, gridTemplateRows: `repeat(${rows.length}, minmax(0, 1fr))` }}>
          {rows.map((row, weekday) => (
            <div key={WEEKDAYS[weekday]} className="contents">
              <span className="flex items-center text-[11px] text-slate-500">{WEEKDAYS[weekday]}</span>
              {row.map((cell) => {
                const label = `${WEEKDAYS[weekday]}, ${pad(cell.hour)}${cell.load === null ? ' — нет слотов' : ` — ${formatPercent(cell.load)}`}`
                return (
                  <Tooltip key={cell.hour} content={label} side={weekday < 2 ? 'bottom' : 'top'} className="block size-full">
                    <span
                      role="img"
                      aria-label={label}
                      className="block size-full rounded-[4px]"
                      style={{ background: cellColor(cell.load) }}
                    />
                  </Tooltip>
                )
              })}
            </div>
          ))}
        </div>
        <div className="grid text-[11px] text-slate-500" style={{ gridTemplateColumns: columns, columnGap: 3 }}>
          <span />
          {hours.map((hour) => (
            <span key={hour} className="text-center">{hour % 2 === 0 ? hour : ''}</span>
          ))}
        </div>
        <div className="flex items-center gap-2 pl-5 pt-0.5 text-[11px] text-slate-500">
          <span>{SCALE_MIN}%</span>
          <span
            aria-hidden
            className="h-2 w-40 rounded-full"
            style={{ background: `linear-gradient(to right, ${cellColor(SCALE_MIN)}, ${cellColor(SCALE_MAX)})` }}
          />
          <span>{SCALE_MAX}%</span>
        </div>
      </div>
    </Card>
  )
}
