import { addDays, startOfDay, toKey } from './dates'
import { emptySavings, isQuit, quitSince, relapseDays, savingsFor, totalEuro, type Savings } from './quit'
import type { AppState } from './types'

export interface MonthReport {
  /** First day of the month */
  month: Date
  cleanDays: number
  relapses: number
  saved: Savings
  euro: number
  goodDone: number
}

/** Totals for one calendar month; only finished days count, like on the cards. */
export function monthReport(state: AppState, month: Date, now: Date): MonthReport {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const next = new Date(month.getFullYear(), month.getMonth() + 1, 1)
  const today = startOfDay(now)
  const saved = emptySavings()
  let cleanDays = 0
  let relapses = 0

  for (const h of state.habits.filter(isQuit)) {
    const rel = relapseDays(state.quit[h.id])
    const start = startOfDay(quitSince(h))
    const end = h.archivedAt ? startOfDay(new Date(h.archivedAt)) : today
    let days = 0
    for (let d = first; d < next && d < end; d = addDays(d, 1)) {
      if (d < start) continue
      if (rel.has(toKey(d))) relapses++
      else days++
    }
    cleanDays += days
    const s = savingsFor(h, days)
    saved.money += s.money
    saved.minutes += s.minutes
    saved.timeValue += s.timeValue
    saved.productiveHours += s.productiveHours
    saved.kcal += s.kcal
  }

  let goodDone = 0
  const from = toKey(first)
  const to = toKey(addDays(next, -1))
  for (const h of state.habits) {
    for (const k of Object.keys(state.done[h.id] ?? {})) if (k >= from && k <= to) goodDone++
  }

  return { month: first, cleanDays, relapses, saved, euro: totalEuro(saved), goodDone }
}
