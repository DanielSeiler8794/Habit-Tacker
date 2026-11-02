import { addDays, fromKey, startOfDay, toKey } from './dates'
import { milestonesFor, type Milestone } from './milestones'
import type { Habit, QuitLog } from './types'

export const DAY_MS = 86_400_000
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
  /** Calories not eaten or drunk */
  kcal: number
}

export const emptySavings = (): Savings => ({ money: 0, minutes: 0, timeValue: 0, productiveHours: 0, kcal: 0 })
export const totalEuro = (s: Savings) => s.money + s.timeValue

export const savesMoney = (h: Habit) => !!h.saves?.includes('money')
export const savesTime = (h: Habit) => !!h.saves?.includes('time')
export const savesKcal = (h: Habit) => !!h.saves?.includes('kcal')

/** What a number of days without the habit saves, at its per-day amounts. */
export function savingsFor(h: Habit, days: number): Savings {
  const money = savesMoney(h) ? days * (h.costMoney ?? 0) : 0
  const minutes = savesTime(h) ? days * (h.costMinutes ?? 0) : 0
  const kcal = savesKcal(h) ? days * (h.costKcal ?? 0) : 0
  const hours = minutes / 60
  return { money, minutes, timeValue: hours * (h.hourValue ?? 0), productiveHours: hours * (h.hourFactor ?? 0), kcal }
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
  nextMilestone: Milestone | null
  /** 0..1 from the last reached milestone to the next */
  milestoneProgress: number
}

/**
 * Nothing has to be ticked: every finished day without a relapse counts and saves
 * its per-day amount. The clean clock runs from quitSince and restarts at each relapse;
 * an archived habit stops counting at the moment it was archived.
 */
export function quitStats(h: Habit, log: QuitLog | undefined, nowArg: Date): QuitStats {
  const now = h.archivedAt ? new Date(Math.min(+nowArg, +new Date(h.archivedAt))) : nowArg
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
  const stones = milestonesFor(h)
  const next = stones.find((m) => m.days > currentDays) ?? null
  const prev = [...stones].reverse().find((m) => m.days <= currentDays)?.days ?? 0

  return {
    currentMs,
    currentDays,
    longestDays: Math.floor(longest / DAY_MS),
    relapses: rel.length,
    cleanDays,
    saved: savingsFor(h, cleanDays),
    nextMilestone: next,
    milestoneProgress: next ? (currentMs / DAY_MS - prev) / (next.days - prev) : 1,
  }
}

/** Suggested time for a relapse entered for a calendar day: now for today, otherwise 20:00 that day. */
export function relapseTimeFor(h: Habit, key: string, now: Date) {
  if (key === toKey(now)) return now
  const d = fromKey(key)
  d.setHours(20, 0, 0, 0)
  const start = quitSince(h)
  return d < start ? new Date(start.getTime() + 60_000) : d
}

export const TRIGGERS = ['Stress', 'Langeweile', 'Gesellschaft', 'Alkohol', 'Müdigkeit', 'Frust', 'Belohnung', 'Gewohnheit', 'Sonstiges']

const WEEKDAY_LONG = ['sonntags', 'montags', 'dienstags', 'mittwochs', 'donnerstags', 'freitags', 'samstags']
const DAYTIMES: [string, number, number][] = [
  ['morgens', 5, 11],
  ['mittags', 11, 14],
  ['nachmittags', 14, 18],
  ['abends', 18, 23],
  ['nachts', 23, 29],
]
const daytimeOf = (hour: number) => DAYTIMES.find(([, a, b]) => (hour < 5 ? hour + 24 : hour) >= a && (hour < 5 ? hour + 24 : hour) < b)![0]

export interface RelapsePatterns {
  total: number
  /** Mon..Sun counts */
  byWeekday: number[]
  byDaytime: { label: string; n: number }[]
  triggers: { label: string; n: number }[]
  /** "Die meisten Rückfälle: freitags, abends, bei Stress", or null with too little data */
  summary: string | null
}

/** Finds when and why relapses tend to happen, from their times and notes. */
export function relapsePatterns(log: QuitLog | undefined): RelapsePatterns {
  const list = (log?.relapses ?? []).map((iso) => ({ d: new Date(iso), note: log?.notes?.[iso] }))
  const byWeekday = [0, 0, 0, 0, 0, 0, 0]
  const daytime = new Map<string, number>()
  const triggers = new Map<string, number>()
  for (const { d, note } of list) {
    byWeekday[(d.getDay() + 6) % 7]++
    const dt = daytimeOf(d.getHours())
    daytime.set(dt, (daytime.get(dt) ?? 0) + 1)
    for (const t of note?.triggers ?? []) triggers.set(t, (triggers.get(t) ?? 0) + 1)
  }
  const sorted = (m: Map<string, number>) => [...m].map(([label, n]) => ({ label, n })).sort((a, b) => b.n - a.n)
  const byDaytime = sorted(daytime)
  const trig = sorted(triggers)

  let summary: string | null = null
  if (list.length >= 2) {
    const parts: string[] = []
    const maxDay = Math.max(...byWeekday)
    const weekend = byWeekday[4] + byWeekday[5] + byWeekday[6]
    if (weekend / list.length >= 0.6 && weekend >= 2) parts.push('rund ums Wochenende')
    else if (maxDay >= 2 && byWeekday.filter((n) => n === maxDay).length === 1) parts.push(WEEKDAY_LONG[(byWeekday.indexOf(maxDay) + 1) % 7])
    if (byDaytime[0] && byDaytime[0].n >= 2 && byDaytime[0].n / list.length >= 0.5) parts.push(byDaytime[0].label)
    if (trig[0] && trig[0].n >= 2) parts.push(`bei ${trig[0].label}`)
    if (parts.length) summary = `Die meisten Rückfälle: ${parts.join(', ')}.`
  }
  return { total: list.length, byWeekday, byDaytime, triggers: trig, summary }
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

export const formatKcal = (kcal: number) => `${num(kcal)} kcal`

/** Short line for a card: "Gespart 397 € · 29 Std" */
export function savingsLine(s: Savings) {
  const parts = []
  if (totalEuro(s) > 0) parts.push(formatEuro(totalEuro(s)))
  if (s.minutes > 0) parts.push(formatMinutes(s.minutes))
  if (s.kcal > 0) parts.push(formatKcal(s.kcal))
  return parts.length ? `Gespart ${parts.join(' · ')}` : null
}
