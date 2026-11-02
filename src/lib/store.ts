import { useEffect, useReducer, useRef, useState } from 'react'
import { openCloud, type Cloud } from './cloud'
import { DEFAULT_CATEGORY } from './categories'
import { BADGES, isUnlocked, summarize } from './gamification'
import { startOfDay, toKey } from './dates'
import type { AppState, Habit, Pause, RelapseNote, SaveKind } from './types'

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
  | { type: 'relapse'; id: string; at: string; note?: RelapseNote }
  | { type: 'unrelapse'; id: string; at: string }
  /** Moves a relapse to another time and/or changes its note */
  | { type: 'editRelapse'; id: string; oldAt: string; at: string; note?: RelapseNote }
  /** Adds delta to a good habit's amount for a day; reaching the target marks it done */
  | { type: 'count'; id: string; key: string; delta: number }
  | { type: 'reorder'; ids: string[] }
  | { type: 'addPause'; pause: Pause }
  | { type: 'removePause'; index: number }
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
    case 'relapse': {
      const log = s.quit[a.id] ?? { relapses: [] }
      const notes = { ...log.notes }
      if (a.note && (a.note.triggers.length || a.note.text)) notes[a.at] = a.note
      return { ...s, quit: { ...s.quit, [a.id]: { ...log, relapses: [...log.relapses, a.at].sort(), notes } } }
    }
    case 'unrelapse': {
      const log = s.quit[a.id] ?? { relapses: [] }
      const notes = { ...log.notes }
      delete notes[a.at]
      return { ...s, quit: { ...s.quit, [a.id]: { ...log, relapses: log.relapses.filter((x) => x !== a.at), notes } } }
    }
    case 'editRelapse': {
      const log = s.quit[a.id] ?? { relapses: [] }
      const notes = { ...log.notes }
      delete notes[a.oldAt]
      if (a.note && (a.note.triggers.length || a.note.text)) notes[a.at] = a.note
      const relapses = [...log.relapses.filter((x) => x !== a.oldAt), a.at].sort()
      return { ...s, quit: { ...s.quit, [a.id]: { ...log, relapses, notes } } }
    }
    case 'clearRelapseDay': {
      const log = s.quit[a.id] ?? { relapses: [] }
      const gone = log.relapses.filter((x) => toKey(new Date(x)) === a.key)
      const notes = { ...log.notes }
      for (const g of gone) delete notes[g]
      return { ...s, quit: { ...s.quit, [a.id]: { ...log, relapses: log.relapses.filter((x) => !gone.includes(x)), notes } } }
    }
    case 'count': {
      const h = s.habits.find((x) => x.id === a.id)
      if (!h) return s
      const target = Math.max(1, h.target ?? 1)
      const n = Math.max(0, Math.min(target * 3, (s.counts[a.id]?.[a.key] ?? 0) + a.delta))
      const counts = { ...(s.counts[a.id] ?? {}), [a.key]: n }
      if (!n) delete counts[a.key]
      const map = { ...(s.done[a.id] ?? {}) }
      if (n >= target) map[a.key] = true
      else delete map[a.key]
      return { ...s, counts: { ...s.counts, [a.id]: counts }, done: { ...s.done, [a.id]: map } }
    }
    case 'reorder': {
      const rank = new Map(a.ids.map((id, i) => [id, i]))
      const habits = [...s.habits].sort((x, y) => (rank.get(x.id) ?? 1e9) - (rank.get(y.id) ?? 1e9))
      return { ...s, habits }
    }
    case 'addPause':
      return { ...s, pauses: [...s.pauses, a.pause].sort((x, y) => (x.from < y.from ? -1 : 1)) }
    case 'removePause':
      return { ...s, pauses: s.pauses.filter((_, i) => i !== a.index) }
    case 'save': {
      const exists = s.habits.some((h) => h.id === a.habit.id)
      const habits = exists ? s.habits.map((h) => (h.id === a.habit.id ? a.habit : h)) : [...s.habits, a.habit]
      return { ...s, habits }
    }
    case 'delete': {
      const done = { ...s.done }
      const quit = { ...s.quit }
      const counts = { ...s.counts }
      delete done[a.id]
      delete quit[a.id]
      delete counts[a.id]
      return { ...s, habits: s.habits.filter((h) => h.id !== a.id), done, quit, counts }
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

export const emptyState = (): AppState => ({ version: 8, habits: [], done: {}, counts: {}, pauses: [], quit: {}, seenBadges: [] })

/** Ids of the example habits earlier versions shipped with; version 6 removes them. */
const EXAMPLE_IDS = new Set(['h-water', 'h-read', 'h-run', 'h-meditate', 'h-phone', 'q-smoke', 'q-scroll'])

/** Before version 7, what was saved came from saveMode, or before that from which costs were filled in. */
function inferSaves(h: Habit): SaveKind[] {
  if (h.saveMode === 'both') return ['money', 'time']
  if (h.saveMode) return [h.saveMode]
  const saves: SaveKind[] = []
  if (h.costMoney) saves.push('money')
  if (h.costMinutes) saves.push('time')
  return saves
}

export function normalize(s: AppState): AppState {
  const version = (s.version as number | undefined) ?? 1
  let habits: Habit[] = s.habits.map((h) => ({ ...h, kind: h.kind ?? 'build', category: h.category ?? DEFAULT_CATEGORY }))
  if (version < 7) habits = habits.map((h) => (h.kind === 'quit' && !h.saves ? { ...h, saves: inferSaves(h) } : h))
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
    const summary = summarize({ version: 8, habits, done, counts: {}, pauses: [], quit, seenBadges: [] }, startOfDay(new Date()), new Date())
    seenBadges = BADGES.filter((b) => isUnlocked(b, summary)).map((b) => b.id)
  }
  return { version: 8, habits, done, counts: s.counts ?? {}, pauses: s.pauses ?? [], quit, seenBadges }
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
