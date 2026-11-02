import confetti from 'canvas-confetti'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Celebration, type CelebrationData } from './components/Celebration'
import { HabitDetail } from './components/HabitDetail'
import { HabitForm } from './components/HabitForm'
import { QuitDetail } from './components/QuitDetail'
import { RelapseForm } from './components/RelapseForm'
import { ProfileView } from './components/ProfileView'
import { SettingsView } from './components/SettingsView'
import { Sheet } from './components/Sheet'
import { TabBar, type Tab } from './components/TabBar'
import { TodayView } from './components/TodayView'
import { fromKey, startOfDay, toKey } from './lib/dates'
import { BADGES, isUnlocked, summarize } from './lib/gamification'
import { startReminderLoop } from './lib/reminders'
import { isQuit, relapseTimeFor } from './lib/quit'
import { habitsForDay } from './lib/stats'
import { useAppState } from './lib/store'
import type { Habit, RelapseNote } from './lib/types'

const BRAND = ['#105bff', '#5b8cff', '#fe8500', '#ffb04d', '#ffffff']

function fireConfetti(big = false) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const base = { colors: BRAND, disableForReducedMotion: true, zIndex: 80 }
  confetti({ ...base, particleCount: big ? 140 : 90, spread: 75, startVelocity: 42, origin: { y: 0.65 } })
  if (big) {
    setTimeout(() => confetti({ ...base, particleCount: 60, angle: 60, spread: 60, origin: { x: 0, y: 0.7 } }), 180)
    setTimeout(() => confetti({ ...base, particleCount: 60, angle: 120, spread: 60, origin: { x: 1, y: 0.7 } }), 260)
  }
}

export default function App() {
  const [state, dispatch, sync] = useAppState()
  const [now, setNow] = useState(() => new Date())
  const [tab, setTab] = useState<Tab>('today')
  const [selected, setSelected] = useState(() => toKey(new Date()))
  const [detailId, setDetailId] = useState<string | null>(null)
  const [form, setFormState] = useState<{ habit: Habit | null; opened: number } | null>(null)
  // Every opening gets a fresh form, even when the sheet is reopened while still closing.
  const setForm = (f: { habit: Habit | null } | null) => setFormState(f && { ...f, opened: Date.now() })
  const [toast, setToast] = useState<{ id: number; msg: string; undo?: () => void } | null>(null)

  const todayKey = toKey(now)
  const today = useMemo(() => fromKey(todayKey), [todayKey])
  const summary = useMemo(() => summarize(state, today, now), [state, today, now])

  // Keep "today" fresh across midnight.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])
  const lastToday = useRef(todayKey)
  useEffect(() => {
    if (lastToday.current !== todayKey) {
      if (selected === lastToday.current) setSelected(todayKey)
      lastToday.current = todayKey
    }
  }, [todayKey, selected])

  const stateRef = useRef(state)
  stateRef.current = state
  useEffect(() => startReminderLoop(() => stateRef.current), [])

  const showToast = useCallback((msg: string, undo?: () => void) => setToast({ id: Date.now(), msg, undo }), [])
  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), toast.undo ? 4500 : 2400)
    return () => clearTimeout(id)
  }, [toast])

  // Badges are derived; show each one once.
  const celebration: CelebrationData | null = useMemo(() => {
    const badge = BADGES.find((b) => isUnlocked(b, summary) && !state.seenBadges.includes(b.id))
    if (badge) return { key: badge.id, emoji: badge.emoji, kicker: 'Neues Abzeichen', title: badge.title, text: badge.desc }
    return null
  }, [summary, state.seenBadges])

  useEffect(() => {
    if (celebration) {
      const t = setTimeout(() => fireConfetti(true), 250)
      return () => clearTimeout(t)
    }
  }, [celebration?.key]) // eslint-disable-line react-hooks/exhaustive-deps

  const closeCelebration = () => {
    if (!celebration) return
    dispatch({ type: 'seenBadges', ids: [celebration.key] })
  }

  const toggle = (id: string, key: string) => {
    const wasDone = !!state.done[id]?.[key]
    if (!wasDone && key === todayKey) {
      const list = habitsForDay(state, startOfDay(now))
      const remaining = list.filter((h) => !state.done[h.id]?.[key])
      if (remaining.length === 1 && remaining[0].id === id) {
        setTimeout(() => fireConfetti(true), 120)
        showToast('Perfekter Tag! Alles erledigt 🎉')
      }
    }
    dispatch({ type: 'toggle', id, key })
  }

  const count = (id: string, key: string, delta: number) => {
    const h = state.habits.find((x) => x.id === id)
    const target = h?.target ?? 1
    const n = (state.counts[id]?.[key] ?? 0) + delta
    // Reaching the target ticks the habit, so it can complete a perfect day like a tick does.
    if (delta > 0 && n === target && !state.done[id]?.[key] && key === todayKey) {
      const remaining = habitsForDay(state, startOfDay(now)).filter((x) => !state.done[x.id]?.[key])
      if (remaining.length === 1 && remaining[0].id === id) {
        setTimeout(() => fireConfetti(true), 120)
        showToast('Perfekter Tag! Alles erledigt 🎉')
      }
    }
    dispatch({ type: 'count', id, key, delta })
  }

  // The relapse form: a new relapse at a suggested time, or an existing one (oldAt) to correct.
  const [relapseForm, setRelapseForm] = useState<{ habit: Habit; at: Date; oldAt?: string; opened: number } | null>(null)

  const saveRelapse = (at: Date, note: RelapseNote) => {
    if (!relapseForm) return
    const { habit, oldAt } = relapseForm
    const iso = at.toISOString()
    setNow(new Date())
    if (oldAt) {
      const prevNote = state.quit[habit.id]?.notes?.[oldAt]
      dispatch({ type: 'editRelapse', id: habit.id, oldAt, at: iso, note })
      showToast('Rückfall geändert', () => dispatch({ type: 'editRelapse', id: habit.id, oldAt: iso, at: oldAt, note: prevNote }))
    } else {
      dispatch({ type: 'relapse', id: habit.id, at: iso, note })
      showToast('Neuer Anlauf. Die Uhr startet neu.', () => dispatch({ type: 'unrelapse', id: habit.id, at: iso }))
    }
    setRelapseForm(null)
  }

  const relapse = (id: string) => {
    const habit = state.habits.find((h) => h.id === id)
    if (habit) setRelapseForm({ habit, at: new Date(), opened: Date.now() })
  }

  const archive = (h: Habit, archived: boolean) => {
    dispatch({ type: 'save', habit: { ...h, archivedAt: archived ? new Date().toISOString() : undefined } })
    setDetailId(null)
    if (archived) {
      setTimeout(() => fireConfetti(true), 150)
      showToast(`${h.emoji} ${h.name} geschafft! Jetzt unter Erfolge.`)
    } else showToast(`${h.emoji} ${h.name} läuft wieder`)
  }

  const detailHabit = state.habits.find((h) => h.id === detailId) ?? null
  const closeAfterDelete = (h: Habit) => {
    dispatch({ type: 'delete', id: h.id })
    setDetailId(null)
    showToast('Gewohnheit gelöscht')
  }

  return (
    <MotionConfig reducedMotion="user">
    <div className="app">
      <main className="shell">
        {/* Tabs switch many times a day: a short fade in, no exit, so it never waits. */}
        <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.14, ease: 'easeOut' }}>
            {tab === 'today' && (
              <TodayView
                state={state}
                summary={summary}
                now={now}
                today={today}
                selected={selected}
                onSelect={setSelected}
                onToggle={toggle}
                onCount={count}
                onRelapse={relapse}
                onOpen={setDetailId}
                onAdd={() => setForm({ habit: null })}
                onToast={showToast}
              />
            )}
            {tab === 'profile' && <ProfileView summary={summary} state={state} now={now} onOpen={setDetailId} />}
            {tab === 'settings' && (
              <SettingsView
                state={state}
                sync={sync}
                onReplace={(s) => {
                  dispatch({ type: 'replace', state: s })
                  setSelected(todayKey)
                }}
                onReorder={(ids) => dispatch({ type: 'reorder', ids })}
                onAddPause={(pause) => dispatch({ type: 'addPause', pause })}
                onRemovePause={(index) => dispatch({ type: 'removePause', index })}
                onToast={showToast}
              />
            )}
        </motion.div>
      </main>

      <TabBar tab={tab} onTab={setTab} onAdd={() => setForm({ habit: null })} />

      <Sheet open={!!detailHabit} onClose={() => setDetailId(null)} label={detailHabit?.name ?? 'Details'} tall>
        {detailHabit && isQuit(detailHabit) && (
          <QuitDetail
            habit={detailHabit}
            log={state.quit[detailHabit.id]}
            stats={summary.perQuit[detailHabit.id]}
            now={now}
            onAddRelapse={(key) => setRelapseForm({ habit: detailHabit, at: relapseTimeFor(detailHabit, key, new Date()), opened: Date.now() })}
            onEditRelapse={(key) => {
              const oldAt = state.quit[detailHabit.id]?.relapses.find((r) => toKey(new Date(r)) === key)
              if (oldAt) setRelapseForm({ habit: detailHabit, at: new Date(oldAt), oldAt, opened: Date.now() })
            }}
            onArchive={(archived) => archive(detailHabit, archived)}
            onClearRelapse={(key) => {
              setNow(new Date())
              dispatch({ type: 'clearRelapseDay', id: detailHabit.id, key })
              showToast('Rückfall entfernt')
            }}
            onEdit={() => {
              setDetailId(null)
              setForm({ habit: detailHabit })
            }}
            onDelete={() => closeAfterDelete(detailHabit)}
          />
        )}
        {detailHabit && !isQuit(detailHabit) && (
          <HabitDetail
            habit={detailHabit}
            done={state.done[detailHabit.id]}
            stats={summary.perHabit[detailHabit.id]}
            today={today}
            onToggle={(key) => dispatch({ type: 'toggle', id: detailHabit.id, key })}
            paused={state.pauses}
            onArchive={(archived) => archive(detailHabit, archived)}
            onEdit={() => {
              setDetailId(null)
              setForm({ habit: detailHabit })
            }}
            onDelete={() => closeAfterDelete(detailHabit)}
          />
        )}
      </Sheet>

      <Sheet open={!!form} onClose={() => setForm(null)} label="Gewohnheit bearbeiten">
        {form && (
          <HabitForm
            key={form.opened}
            habit={form.habit}
            onCancel={() => setForm(null)}
            onSave={(h) => {
              dispatch({ type: 'save', habit: h })
              showToast(form.habit ? 'Gespeichert' : `${h.emoji} ${h.name} ist dabei!`)
              setForm(null)
              setTab('today')
              setSelected(todayKey)
            }}
          />
        )}
      </Sheet>

      <Sheet open={!!relapseForm} onClose={() => setRelapseForm(null)} label="Rückfall">
        {relapseForm && (
          <RelapseForm
            key={relapseForm.opened}
            habit={relapseForm.habit}
            at={relapseForm.at}
            note={relapseForm.oldAt ? state.quit[relapseForm.habit.id]?.notes?.[relapseForm.oldAt] : undefined}
            editing={!!relapseForm.oldAt}
            onSave={saveRelapse}
            onCancel={() => setRelapseForm(null)}
          />
        )}
      </Sheet>

      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            className="toast"
            role="status"
            initial={{ opacity: 0, y: -24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.28, ease: [0.23, 1, 0.32, 1] } }}
            exit={{ opacity: 0, y: -14, scale: 0.98, transition: { duration: 0.16, ease: 'easeOut' } }}
          >
            <span>{toast.msg}</span>
            {toast.undo && (
              <button
                className="toast-undo"
                onClick={() => {
                  toast.undo?.()
                  setToast(null)
                }}
              >
                Rückgängig
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Celebration data={celebration} onClose={closeCelebration} />
    </div>
    </MotionConfig>
  )
}
