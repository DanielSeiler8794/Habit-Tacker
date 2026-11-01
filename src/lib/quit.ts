import { addDays, fromKey, startOfDay, toKey } from './dates'
import type { Habit, QuitLog } from './types'

export const DAY_MS = 86_400_000
export const MILESTONES = [1, 3, 7, 14, 30, 60, 90, 180, 365]

export const isQuit = (h: Habit) => h.kind === 'quit'
export const quitSince = (h: Habit) => new Date(h.quitSince ?? `${h.createdAt}T00:00:00`)

export interface Savings {
  /** Euro not spent */
  money: number
  /** Minutes not spent on the habit */
  minutes: number
  /** Euro value of the saved time at the habit's hour value */
  timeValue: number
  /** Productive hours the saved time equals at the habit's factor */
  productiveHours: number
}

export const emptySavings = (): Savings => ({ money: 0, minutes: 0, timeValue: 0, productiveHours: 0 })
export const totalEuro = (s: Savings) => s.money + s.timeValue

export const savesMoney = (h: Habit) => h.saveMode === 'money' || h.saveMode === 'both'
export const savesTime = (h: Habit) => h.saveMode === 'time' || h.saveMode === 'both'

/** What a number of days without the habit saves, at its per-day amounts. */
export function savingsFor(h: Habit, days: number): Savings {
  const money = savesMoney(h) ? days * (h.costMoney ?? 0) : 0
  const minutes = savesTime(h) ? days * (h.costMinutes ?? 0) : 0
  const hours = minutes / 60
  return { money, minutes, timeValue: hours * (h.hourValue ?? 0), productiveHours: hours * (h.hourFactor ?? 0) }
}

export const relapseDays = (log: QuitLog | undefined) => new Set((log?.relapses ?? []).map((r) => toKey(new Date(r))))

export interface QuitStats {
  currentMs: number
  currentDays: number
  longestDays: number
  relapses: number
  /** Finished calendar days since the start without a relapse; they count automatically */
  cleanDays: number
  saved: Savings
  nextMilestone: number | null
  /** 0..1 from the last reached milestone to the next */
  milestoneProgress: number
}

/**
 * Nothing has to be ticked: every finished day without a relapse counts and saves
 * its per-day amount. The clean clock runs from quitSince and restarts at each relapse.
 */
export function quitStats(h: Habit, log: QuitLog | undefined, now: Date): QuitStats {
  const t = now.getTime()
  const start = quitSince(h)
  const rel = (log?.relapses ?? []).map(Date.parse).filter((x) => x >= start.getTime() && x <= t).sort((a, b) => a - b)
  const bounds = [start.getTime(), ...rel]

  let longest = 0
  bounds.forEach((b, i) => {
    longest = Math.max(longest, (i + 1 < bounds.length ? bounds[i + 1] : t) - b)
  })

  const relDays = relapseDays(log)
  const today = startOfDay(now)
  let cleanDays = 0
  for (let d = startOfDay(start); d < today; d = addDays(d, 1)) if (!relDays.has(toKey(d))) cleanDays++

  const currentMs = Math.max(0, t - bounds[bounds.length - 1])
  const currentDays = Math.floor(currentMs / DAY_MS)
  const next = MILESTONES.find((m) => m > currentDays) ?? null
  const prev = [...MILESTONES].reverse().find((m) => m <= currentDays) ?? 0

  return {
    currentMs,
    currentDays,
    longestDays: Math.floor(longest / DAY_MS),
    relapses: rel.length,
    cleanDays,
    saved: savingsFor(h, cleanDays),
    nextMilestone: next,
    milestoneProgress: next ? (currentMs / DAY_MS - prev) / (next - prev) : 1,
  }
}

/** When a relapse entered for a calendar day happened: now for today, otherwise that evening. */
export function relapseTimeFor(h: Habit, key: string, now: Date) {
  if (key === toKey(now)) return now
  const d = fromKey(key)
  d.setHours(20, 0, 0, 0)
  const start = quitSince(h)
  return d < start ? new Date(start.getTime() + 60_000) : d
}

export function formatClean(ms: number) {
  const d = Math.floor(ms / DAY_MS)
  const h = Math.floor((ms % DAY_MS) / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  if (d > 0) return `${d} T ${h} Std`
  if (h > 0) return `${h} Std ${m} Min`
  return `${m} Min`
}

const num = (n: number) => Math.floor(n).toLocaleString('de-DE')

/** Cents only for small amounts: 0,45 € but 1.282 € */
export const formatEuro = (n: number) =>
  n < 100 ? `${n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : `${num(n)} €`

export const formatMinutes = (min: number) => (min < 60 ? `${num(min)} Min` : `${num(min / 60)} Std`)

/** Short line for a card: "Gespart 397 € · 29 Std" */
export function savingsLine(s: Savings) {
  const parts = []
  if (totalEuro(s) > 0) parts.push(formatEuro(totalEuro(s)))
  if (s.minutes > 0) parts.push(formatMinutes(s.minutes))
  return parts.length ? `Gespart ${parts.join(' · ')}` : null
}
