export type HabitKind = 'build' | 'quit'

/** What giving up a bad habit saves; any combination */
export type SaveKind = 'money' | 'time' | 'kcal'

/** Good habits: on fixed weekdays, or a number of times in each Monday–Sunday week */
export type Frequency = 'days' | 'weekly'

/** Before version 7: one of three fixed choices */
export type SaveMode = 'money' | 'time' | 'both'

export interface Habit {
  id: string
  name: string
  emoji: string
  /** 'build' = a good habit to tick off, 'quit' = a bad habit to give up */
  kind: HabitKind
  /** One of CATEGORIES in categories.ts */
  category: string
  /** Weekdays as JS getDay() values, 0 = Sunday. Quit habits use all days. */
  days: number[]
  /** Good habits: weekdays (default) or times per week */
  frequency?: Frequency
  timesPerWeek?: number
  /** Good habits: amount to reach per day, e.g. 8; unset or 1 is a plain tick */
  target?: number
  /** Unit for target, e.g. "Gläser" */
  unit?: string
  /** "HH:MM" or null */
  reminder: string | null
  /** YYYY-MM-DD */
  createdAt: string
  /** Quit habits: ISO timestamp the clean time is counted from */
  quitSince?: string
  /** Quit habits: what is saved, and what one day without the habit saves */
  saves?: SaveKind[]
  /** Replaced by saves in version 7 */
  saveMode?: SaveMode
  /** Euro per day */
  costMoney?: number
  /** Minutes per day */
  costMinutes?: number
  /** Calories per day */
  costKcal?: number
  /** Euro one saved hour is worth, e.g. an internal working hour */
  hourValue?: number
  /** One saved hour equals this many hours of something productive ... */
  hourFactor?: number
  /** ... named here, e.g. "Lernen" */
  factorLabel?: string
  /** Quit habits: what the savings go towards, e.g. headphones for 250 € */
  goalName?: string
  goalEuro?: number
  /** Template the habit was created from; picks its milestones */
  template?: string
  /** ISO time the habit was marked as done for good; its stats freeze and it leaves the daily view */
  archivedAt?: string
}

/** dateKey -> true */
export type DoneMap = Record<string, true>

/** Why a relapse happened, entered with it */
export interface RelapseNote {
  triggers: string[]
  text?: string
}

/** ISO timestamps, oldest first */
export interface QuitLog {
  relapses: string[]
  /** Keyed by the relapse's ISO timestamp */
  notes?: Record<string, RelapseNote>
  /** From an earlier version that counted each resist; no longer used */
  resists?: string[]
}

/** Inclusive range of YYYY-MM-DD keys on which good habits rest without breaking streaks */
export interface Pause {
  from: string
  to: string
}

export interface AppState {
  version: 8
  habits: Habit[]
  done: Record<string, DoneMap>
  /** Good habits with a target: amount per day; done is set once it reaches the target */
  counts: Record<string, Record<string, number>>
  pauses: Pause[]
  quit: Record<string, QuitLog>
  seenBadges: string[]
}
