export type Random = () => number

/** mulberry32: small, fast, good enough for mock data and fully deterministic. */
export const createRandom = (seed: number): Random => {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const randInt = (rnd: Random, min: number, max: number): number => min + Math.floor(rnd() * (max - min + 1))

export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value))

export const pad2 = (value: number): string => (value < 10 ? `0${value}` : `${value}`)

export const lerp = (from: number, to: number, t: number): number => from + (to - from) * t

/** Indexed access that fails loudly instead of returning `undefined` (the generator never reads out of range). */
export const at = <T>(items: readonly T[], index: number): T => {
  const item = items[index]
  if (item === undefined) throw new Error(`Index ${index} is out of range (length ${items.length})`)
  return item
}

export const pickWeighted = <T>(rnd: Random, items: readonly T[], weights: readonly number[]): T => {
  let total = 0
  for (const weight of weights) total += weight
  let threshold = rnd() * total
  for (let index = 0; index < items.length; index++) {
    threshold -= at(weights, index)
    if (threshold < 0) return at(items, index)
  }
  return at(items, items.length - 1)
}

export const pickOne = <T>(rnd: Random, items: readonly T[]): T => at(items, Math.floor(rnd() * items.length))
