export type HabitKind = 'build' | 'quit'

/** What giving up a bad habit saves */
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
  /** "HH:MM" or null */
  reminder: string | null
  /** YYYY-MM-DD */
  createdAt: string
  /** Quit habits: ISO timestamp the clean time is counted from */
  quitSince?: string
  /** Quit habits: what is saved, and what one day without the habit saves */
  saveMode?: SaveMode
  /** Euro per day */
  costMoney?: number
  /** Minutes per day */
  costMinutes?: number
  /** Euro one saved hour is worth, e.g. an internal working hour */
  hourValue?: number
  /** One saved hour equals this many hours of something productive ... */
  hourFactor?: number
  /** ... named here, e.g. "Lernen" */
  factorLabel?: string
}

/** dateKey -> true */
export type DoneMap = Record<string, true>

/** ISO timestamps, oldest first */
export interface QuitLog {
  relapses: string[]
  /** From an earlier version that counted each resist; no longer used */
  resists?: string[]
}

export interface AppState {
  version: 5
  habits: Habit[]
  done: Record<string, DoneMap>
  quit: Record<string, QuitLog>
  seenBadges: string[]
}
