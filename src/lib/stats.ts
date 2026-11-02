import { addDays, fromKey, startOfDay, toKey } from './dates'
import type { AppState, DoneMap, Habit, Pause } from './types'

export const isScheduled = (h: Habit, d: Date) => h.days.includes(d.getDay())
export const isWeekly = (h: Habit) => h.frequency === 'weekly'
export const isArchived = (h: Habit) => !!h.archivedAt
export const hasTarget = (h: Habit) => (h.target ?? 1) > 1

export const pausedCheck = (pauses: Pause[]) => (k: string) => pauses.some((p) => p.from <= k && k <= p.to)

/** The last day a habit counts: today, or the day it was archived. */
export const lastDay = (h: Habit, today: Date) => (h.archivedAt ? startOfDay(new Date(Math.min(+today, +new Date(h.archivedAt)))) : today)

/** Monday of the week a day falls in */
export const weekStart = (d: Date) => addDays(startOfDay(d), -((d.getDay() + 6) % 7))

/** A good habit on fixed weekdays is due on a day unless that day is paused. Weekly ones have no fixed day. */
export function isPlannedOn(h: Habit, d: Date, paused: (k: string) => boolean) {
  const k = toKey(d)
  if (h.kind === 'quit' || isWeekly(h) || h.createdAt > k || paused(k)) return false
  if (h.archivedAt && k > toKey(new Date(h.archivedAt))) return false
  return isScheduled(h, d)
}

export interface HabitStats {
  current: number
  longest: number
  /** Streaks count days, or weeks for weekly habits */
  unit: 'day' | 'week'
  total: number
  /** 0..1: due days done over the last 30 days, or weeks reached over the last 4 */
  rate30: number
  /** Weekly habits: done days in the current week */
  weekDone: number
}

/**
 * Walks the habit's history once. Only due days count towards a streak; paused days
 * and an unfinished today never break it. Weekly habits count weeks that reach the target.
 */
export function habitStats(h: Habit, done: DoneMap | undefined, today: Date, paused: (k: string) => boolean = () => false): HabitStats {
  const end = lastDay(h, today)
  const tKey = toKey(end)
  const start = fromKey(h.createdAt)
  let total = 0
  for (let d = start; d <= end; d = addDays(d, 1)) if (done?.[toKey(d)]) total++

  if (isWeekly(h)) {
    const times = Math.max(1, h.timesPerWeek ?? 1)
    const thisWeek = toKey(weekStart(end))
    let run = 0
    let longest = 0
    let met = 0
    let weeks = 0
    let weekDone = 0
    for (let w = weekStart(start); w <= end; w = addDays(w, 7)) {
      let n = 0
      for (let i = 0; i < 7; i++) if (done?.[toKey(addDays(w, i))]) n++
      const current = toKey(w) === thisWeek
      if (current) weekDone = n
      if (n >= times) {
        run++
        longest = Math.max(longest, run)
      } else if (!current) {
        run = 0
      }
      if (!current && +w >= +addDays(weekStart(end), -28)) {
        weeks++
        if (n >= times) met++
      }
    }
    return { current: run, longest, unit: 'week', total, rate30: weeks ? met / weeks : 0, weekDone }
  }

  let run = 0
  let longest = 0
  for (let d = start; d <= end; d = addDays(d, 1)) {
    const k = toKey(d)
    if (!isPlannedOn(h, d, paused)) continue
    if (done?.[k]) {
      run++
      if (run > longest) longest = run
    } else if (k !== tKey) {
      run = 0
    }
  }

  let due = 0
  let hit = 0
  for (let i = 0; i < 30; i++) {
    const d = addDays(end, -i)
    if (d < start) break
    if (!isPlannedOn(h, d, paused)) continue
    const k = toKey(d)
    if (k === tKey && !done?.[k]) continue
    due++
    if (done?.[k]) hit++
  }

  return { current: run, longest, unit: 'day', total, rate30: due ? hit / due : 0, weekDone: 0 }
}

/** Good habits due on a day (fixed weekdays only); quit and weekly habits have no daily plan. */
export function habitsForDay(state: AppState, d: Date) {
  const paused = pausedCheck(state.pauses)
  return state.habits.filter((h) => isPlannedOn(h, d, paused))
}
