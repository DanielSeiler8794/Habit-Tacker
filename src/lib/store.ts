import { useEffect, useReducer, useRef, useState } from 'react'
import { openCloud, type Cloud } from './cloud'
import { DEFAULT_CATEGORY } from './categories'
import { BADGES, isUnlocked, summarize } from './gamification'
import { startOfDay, toKey } from './dates'
import type { AppState, Habit, SaveMode } from './types'

const KEY = 'habits:v1'
const UPDATED_KEY = 'habits:updatedAt'

/** Where the data lives: only this browser, syncing via the Claude account, or synced */
export type SyncStatus = 'local' | 'connecting' | 'synced' | 'offline'

function loadUpdatedAt() {
  try {
    return Number(localStorage.getItem(UPDATED_KEY)) || 0
  } catch {
    return 0
  }
}

export type Action =
  | { type: 'toggle'; id: string; key: string }
  | { type: 'relapse' | 'unrelapse'; id: string; at: string }
  /** Removes every relapse logged on one calendar day */
  | { type: 'clearRelapseDay'; id: string; key: string }
  | { type: 'save'; habit: Habit }
  | { type: 'delete'; id: string }
  | { type: 'seenBadges'; ids: string[] }
  | { type: 'replace'; state: AppState }

function reducer(s: AppState, a: Action): AppState {
  switch (a.type) {
    case 'toggle': {
      const h = s.habits.find((x) => x.id === a.id)
      if (!h) return s
      const map = { ...(s.done[a.id] ?? {}) }
      if (map[a.key]) delete map[a.key]
      else map[a.key] = true
      // Ticking a day before the habit existed moves its start back.
      const habits = a.key < h.createdAt ? s.habits.map((x) => (x.id === a.id ? { ...x, createdAt: a.key } : x)) : s.habits
      return { ...s, habits, done: { ...s.done, [a.id]: map } }
    }
    case 'relapse':
    case 'unrelapse': {
      const log = s.quit[a.id] ?? { relapses: [] }
      const relapses = a.type === 'unrelapse' ? log.relapses.filter((x) => x !== a.at) : [...log.relapses, a.at].sort()
      return { ...s, quit: { ...s.quit, [a.id]: { ...log, relapses } } }
    }
    case 'clearRelapseDay': {
      const log = s.quit[a.id] ?? { relapses: [] }
      const relapses = log.relapses.filter((x) => toKey(new Date(x)) !== a.key)
      return { ...s, quit: { ...s.quit, [a.id]: { ...log, relapses } } }
    }
    case 'save': {
      const exists = s.habits.some((h) => h.id === a.habit.id)
      const habits = exists ? s.habits.map((h) => (h.id === a.habit.id ? a.habit : h)) : [...s.habits, a.habit]
      return { ...s, habits }
    }
    case 'delete': {
      const done = { ...s.done }
      const quit = { ...s.quit }
      delete done[a.id]
      delete quit[a.id]
      return { ...s, habits: s.habits.filter((h) => h.id !== a.id), done, quit }
    }
    case 'seenBadges':
      return { ...s, seenBadges: [...new Set([...s.seenBadges, ...a.ids])] }
    case 'replace':
      return a.state
  }
}

export function isAppState(x: unknown): x is AppState {
  const s = x as AppState
  return !!s && Array.isArray(s.habits) && typeof s.done === 'object' && s.done !== null
}

export const emptyState = (): AppState => ({ version: 6, habits: [], done: {}, quit: {}, seenBadges: [] })

/** Ids of the example habits earlier versions shipped with; version 6 removes them. */
const EXAMPLE_IDS = new Set(['h-water', 'h-read', 'h-run', 'h-meditate', 'h-phone', 'q-smoke', 'q-scroll'])

/** Before saveMode existed, what was saved followed from which costs were filled in. */
function inferSaveMode(h: Habit): SaveMode | undefined {
  if (h.costMoney && h.costMinutes) return 'both'
  if (h.costMoney) return 'money'
  if (h.costMinutes) return 'time'
  return undefined
}

export function normalize(s: AppState): AppState {
  const version = (s.version as number | undefined) ?? 1
  let habits: Habit[] = s.habits.map((h) => ({ ...h, kind: h.kind ?? 'build', category: h.category ?? DEFAULT_CATEGORY }))
  if (version < 3) habits = habits.map((h) => (h.kind === 'quit' ? { ...h, saveMode: h.saveMode ?? inferSaveMode(h) } : h))
  const done = { ...s.done }
  const quit = { ...(s.quit ?? {}) }
  let seenBadges = s.seenBadges ?? []
  if (version < 6) {
    habits = habits.filter((h) => !EXAMPLE_IDS.has(h.id))
    for (const id of EXAMPLE_IDS) {
      delete done[id]
      delete quit[id]
    }
    // Badges the examples had earned are forgotten, so earning them for real celebrates again.
    const summary = summarize({ version: 6, habits, done, quit, seenBadges: [] }, startOfDay(new Date()), new Date())
    seenBadges = BADGES.filter((b) => isUnlocked(b, summary)).map((b) => b.id)
  }
  return { version: 6, habits, done, quit, seenBadges }
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (isAppState(parsed)) return normalize(parsed)
    }
  } catch {
    // storage blocked or corrupt: start empty
  }
  return emptyState()
}

export function useAppState() {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  const [sync, setSync] = useState<SyncStatus>(() => ((window as unknown as { claude?: unknown }).claude ? 'connecting' : 'local'))
  const cloud = useRef<Cloud | null>(null)
  const stateRef = useRef(state)
  stateRef.current = state
  // updatedAt: when this device's data last changed. fromRemote: the next state change came from the cloud.
  const meta = useRef({ updatedAt: loadUpdatedAt(), fromRemote: false, first: true })

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      // private mode etc.
    }
    const m = meta.current
    if (m.first || m.fromRemote) {
      m.first = false
      m.fromRemote = false
      return
    }
    m.updatedAt = Date.now()
    try {
      localStorage.setItem(UPDATED_KEY, String(m.updatedAt))
    } catch {
      // ignore
    }
    cloud.current?.save(state, m.updatedAt)
  }, [state])

  // Newest change wins between this device and the account copy.
  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    let cancelled = false
    const timeout = window.setTimeout(() => setSync((s) => (s === 'connecting' ? 'offline' : s)), 10_000)
    openCloud().then((c) => {
      if (cancelled) return
      if (!c) {
        window.clearTimeout(timeout)
        setSync('local')
        return
      }
      cloud.current = c
      unsubscribe = c.subscribe(
        (doc, confirmed) => {
          const m = meta.current
          if (doc && doc.updatedAt > m.updatedAt) {
            try {
              const parsed = JSON.parse(doc.json)
              if (isAppState(parsed)) {
                m.fromRemote = true
                m.updatedAt = doc.updatedAt
                localStorage.setItem(UPDATED_KEY, String(doc.updatedAt))
                dispatch({ type: 'replace', state: normalize(parsed) })
              }
            } catch {
              // a broken copy never overwrites good local data
            }
          } else if (confirmed && (!doc || doc.updatedAt < m.updatedAt || !m.updatedAt)) {
            c.save(stateRef.current, m.updatedAt || Date.now())
          }
          if (confirmed) {
            window.clearTimeout(timeout)
            setSync('synced')
          }
        },
        () => setSync('offline'),
      )
    })
    return () => {
      cancelled = true
      window.clearTimeout(timeout)
      unsubscribe?.()
    }
  }, [])

  return [state, dispatch, sync] as const
}
