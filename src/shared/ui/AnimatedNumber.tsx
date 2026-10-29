import { useEffect, useRef, useState } from 'react'

interface AnimatedNumberProps {
  value: number
  /** Formats the number for display; called for every intermediate frame. */
  format: (value: number) => string
  /** Duration of the count between the old and the new value, ms. */
  duration?: number
}

const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3

/** Animations run only where the browser reports that motion is welcome (no `matchMedia`, e.g. in jsdom — no animation). */
const motionAllowed = (): boolean =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: no-preference)').matches

/**
 * Shows a number and, when `value` changes, counts quickly from the shown value to the new one.
 * The first render and users who prefer reduced motion get the final value at once.
 */
export const AnimatedNumber = ({ value, format, duration = 600 }: AnimatedNumberProps) => {
  const [shown, setShown] = useState(value)
  const shownRef = useRef(value)

  useEffect(() => {
    const from = shownRef.current
    if (from === value) return
    if (!motionAllowed()) {
      // Nothing to animate: the render below already shows `value`.
      shownRef.current = value
      return
    }
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const next = progress === 1 ? value : from + (value - from) * easeOutCubic(progress)
      shownRef.current = next
      setShown(next)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration])

  // Until the effect has caught up with a new value (and in tests), the final number is what is rendered.
  return <>{format(motionAllowed() ? shown : value)}</>
}
