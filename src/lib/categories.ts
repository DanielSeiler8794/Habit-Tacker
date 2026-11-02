import { addDays, fromKey, toKey } from './dates'
import { isQuit, quitSince, relapseDays } from './quit'
import { isArchived, isPlannedOn, isWeekly, pausedCheck } from './stats'
import type { AppState, Habit } from './types'

export const CATEGORIES = [
  { id: 'gesundheit', label: 'Gesundheit' },
  { id: 'bewegung', label: 'Bewegung' },
  { id: 'geist', label: 'Geist' },
  { id: 'lernen', label: 'Lernen' },
  { id: 'alltag', label: 'Alltag' },
] as const

export type CategoryId = (typeof CATEGORIES)[number]['id']

export const DEFAULT_CATEGORY: CategoryId = 'alltag'

export const categoryLabel = (id: string) => CATEGORIES.find((c) => c.id === id)?.label ?? 'Alltag'

export interface CategoryStats {
  id: CategoryId
  label: string
  habits: Habit[]
  /** Days in a row on which every scheduled habit of the category was done */
  streak: number
  doneToday: number
  plannedToday: number
}

/**
 * A day counts when all habits of the category planned for it are done; a quit habit
 * counts as done on every day without a relapse. Days with nothing planned are skipped,
 * and an unfinished today does not break the streak.
 */
export function categoryStats(state: AppState, today: Date): CategoryStats[] {
  const tKey = toKey(today)
  const relapses = new Map(state.habits.filter(isQuit).map((h) => [h.id, relapseDays(state.quit[h.id])]))
  const startKey = (h: Habit) => (isQuit(h) ? toKey(quitSince(h)) : h.createdAt)
  const paused = pausedCheck(state.pauses)
  const isPlanned = (h: Habit, d: Date, k: string) => (isQuit(h) ? startKey(h) <= k : isPlannedOn(h, d, paused))
  const isDone = (h: Habit, k: string) => (isQuit(h) ? !relapses.get(h.id)!.has(k) : !!state.done[h.id]?.[k])

  return CATEGORIES.map(({ id, label }) => {
    // Weekly habits have no daily plan, archived ones are finished: neither shapes a category's days.
    const habits = state.habits.filter((h) => h.category === id && !isWeekly(h) && !isArchived(h))
    const plannedNow = habits.filter((h) => isPlanned(h, today, tKey))
    const doneToday = plannedNow.filter((h) => isDone(h, tKey)).length

    let streak = 0
    if (habits.length) {
      const first = fromKey(habits.reduce((m, h) => (startKey(h) < m ? startKey(h) : m), tKey))
      for (let d = today; d >= first; d = addDays(d, -1)) {
        const k = toKey(d)
        const planned = habits.filter((h) => isPlanned(h, d, k))
        if (!planned.length) continue
        if (planned.every((h) => isDone(h, k))) streak++
        else if (k !== tKey) break
      }
    }
    return { id, label, habits, streak, doneToday, plannedToday: plannedNow.length }
  }).filter((c) => c.habits.length > 0)
}
