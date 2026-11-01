import confetti from 'canvas-confetti'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Celebration, type CelebrationData } from './components/Celebration'
import { HabitDetail } from './components/HabitDetail'
import { HabitForm } from './components/HabitForm'
import { QuitDetail } from './components/QuitDetail'
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
import type { Habit } from './lib/types'

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
  const [form, setForm] = useState<{ habit: Habit | null } | null>(null)
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

  const relapse = (id: string) => {
    const at = new Date().toISOString()
    setNow(new Date())
    dispatch({ type: 'relapse', id, at })
    showToast('Neuer Anlauf. Die Uhr startet neu.', () => dispatch({ type: 'unrelapse', id, at }))
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
                onRelapse={relapse}
                onOpen={setDetailId}
                onAdd={() => setForm({ habit: null })}
                onToast={showToast}
              />
            )}
            {tab === 'profile' && <ProfileView summary={summary} habits={state.habits} />}
            {tab === 'settings' && (
              <SettingsView
                state={state}
                sync={sync}
                onReplace={(s) => {
                  dispatch({ type: 'replace', state: s })
                  setSelected(todayKey)
                }}
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
            onAddRelapse={(key) => {
              const at = relapseTimeFor(detailHabit, key, new Date()).toISOString()
              setNow(new Date())
              dispatch({ type: 'relapse', id: detailHabit.id, at })
              showToast('Rückfall eingetragen', () => dispatch({ type: 'unrelapse', id: detailHabit.id, at }))
            }}
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
            key={form.habit?.id ?? 'new'}
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

      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            className="toast"
            role="status"
            initial={{ opacity: 0, transform: 'translateY(-100%) scale(0.96)' }}
            animate={{ opacity: 1, transform: 'translateY(0%) scale(1)', transition: { duration: 0.28, ease: [0.23, 1, 0.32, 1] } }}
            exit={{ opacity: 0, transform: 'translateY(-60%) scale(0.98)', transition: { duration: 0.16, ease: 'easeOut' } }}
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
