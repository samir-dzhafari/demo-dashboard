import { useEffect, useState } from 'react'
import { formatNumber, formatPercent } from '@/shared/lib/format'
import { AnimatedNumber, Card, EmptyState } from '@/shared/ui'
import { STAGE_TITLES, useAcquisitionFunnel } from '../model/useAcquisitionFunnel'

/** Stage fill goes from dark navy through blue to green as the audience gets "hotter". */
const STAGE_STYLES = [
  { color: '#111C3A', width: 100 },
  { color: '#2F5BEA', width: 88 },
  { color: '#4C6FEE', width: 76 },
  { color: '#14B8A6', width: 66 },
  { color: '#0E9F8E', width: 58 },
] as const

/** Funnel from site visits to repeat clients. A stage click is a stub: the lead list is out of scope of this release. */
export const AcquisitionFunnel = () => {
  const stages = useAcquisitionFunnel()
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2500)
    return () => window.clearTimeout(timer)
  }, [toast])

  const isEmpty = stages.every((stage) => stage.count === 0)

  return (
    <Card title="Воронка привлечения" subtitle="От визита до повторного обращения" className="relative h-full">
      {isEmpty ? (
        <EmptyState />
      ) : (
        <ol className="flex h-full min-h-0 flex-col justify-around gap-2 pb-1" data-testid="acquisition-funnel">
          {stages.map((stage, index) => {
            const style = STAGE_STYLES[index] ?? STAGE_STYLES[STAGE_STYLES.length - 1]!
            const title = STAGE_TITLES[stage.key]
            return (
              <li key={stage.key} className="grid min-h-0 grid-cols-[minmax(0,1fr)_64px] sm:grid-cols-[minmax(0,1fr)_76px] items-center gap-3">
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setToast(`Список заявок этапа «${title}» — во второй очереди`)}
                    style={{ width: `${style.width}%`, background: style.color }}
                    className="flex h-10 items-center justify-between gap-2 rounded-lg px-2.5 text-white transition-[filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                  >
                    <span className="min-w-0 truncate text-[12px] font-medium" title={title}>{title}</span>
                    <span className="shrink-0 text-[14px] font-bold tabular-nums"><AnimatedNumber value={stage.count} format={formatNumber} /></span>
                  </button>
                </div>
                <p className="text-right text-xs leading-4 text-slate-500">
                  {stage.conversionFromPrevious !== null && (
                    <>
                      <span className="block text-[13px] font-semibold text-slate-800 tabular-nums"><AnimatedNumber value={stage.conversionFromPrevious} format={formatPercent} /></span>
                      конверсия
                    </>
                  )}
                </p>
              </li>
            )
          })}
        </ol>
      )}
      {toast && (
        <p role="status" className="absolute inset-x-4 bottom-3 rounded-lg bg-slate-900 px-3 py-2 text-center text-xs text-white shadow-lg">
          {toast}
        </p>
      )}
    </Card>
  )
}
