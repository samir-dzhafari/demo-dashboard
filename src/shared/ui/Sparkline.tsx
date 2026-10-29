import { useId } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from 'recharts'

export type SparklineTone = 'blue' | 'green' | 'red'

const COLORS: Record<SparklineTone, string> = { blue: '#2F5BEA', green: '#12B5A0', red: '#EF4444' }

export interface SparklinePoint {
  /** Caption in the hover tooltip, e.g. "Окт 2026". */
  label: string
  value: number
}

interface SparklineProps {
  data: readonly SparklinePoint[]
  tone?: SparklineTone
  height?: number
  /** Formats a value for the tooltip (with its unit). */
  formatValue?: (value: number) => string
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ payload: SparklinePoint }>
  formatValue: (value: number) => string
}

const SparkTooltip = ({ active, payload, formatValue }: TooltipProps) => {
  const point = payload?.[0]?.payload
  if (!active || !point) return null
  return (
    <div className="rounded-md bg-slate-900 px-2 py-1 text-xs text-white shadow-md">
      <p className="text-slate-300">{point.label}</p>
      <p className="font-semibold tabular-nums">{formatValue(point.value)}</p>
    </div>
  )
}

/** Compact area sparkline without axes or grid; hovering a point shows its period and value. */
export const Sparkline = ({ data, tone = 'blue', height = 36, formatValue = String }: SparklineProps) => {
  const gradientId = useId()
  const color = COLORS[tone]
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data as SparklinePoint[]} margin={{ top: 4, right: 4, bottom: 2, left: 4 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.18} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Tooltip
            content={<SparkTooltip formatValue={formatValue} />}
            cursor={{ stroke: color, strokeOpacity: 0.3 }}
            allowEscapeViewBox={{ x: false, y: true }}
            wrapperStyle={{ zIndex: 50, pointerEvents: 'none' }}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 3.5, fill: color, stroke: '#fff', strokeWidth: 1.5 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
