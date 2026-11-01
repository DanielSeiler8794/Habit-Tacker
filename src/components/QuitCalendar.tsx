import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { addDays, fromKey, startOfDay, toKey } from '../lib/dates'
import { quitSince, relapseDays } from '../lib/quit'
import type { Habit, QuitLog } from '../lib/types'
import { IconChevronLeft } from './icons'

interface Props {
  habit: Habit
  log: QuitLog | undefined
  now: Date
  onAddRelapse: (key: string) => void
  onClearRelapse: (key: string) => void
}

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const monthName = (d: Date) => d.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })

/** Month view of a bad habit: days held in blue, relapses in red. Tapping a day corrects it. */
export function QuitCalendar({ habit, log, now, onAddRelapse, onClearRelapse }: Props) {
  const today = startOfDay(now)
  const todayKey = toKey(today)
  const startKey = toKey(quitSince(habit))
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected, setSelected] = useState<string | null>(null)
  const relapses = useMemo(() => relapseDays(log), [log])

  const firstMonth = fromKey(startKey.slice(0, 8) + '01')
  const canBack = month > firstMonth
  const canForward = month < new Date(today.getFullYear(), today.getMonth(), 1)

  const cells = useMemo(() => {
    const lead = (month.getDay() + 6) % 7
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
    return [
      ...Array.from({ length: lead }, () => null),
      ...Array.from({ length: days }, (_, i) => {
        const d = addDays(month, i)
        const k = toKey(d)
        const state = k < startKey || k > todayKey ? 'none' : relapses.has(k) ? 'relapse' : k === todayKey ? 'today' : 'clean'
        return { k, n: i + 1, state }
      }),
    ]
  }, [month, startKey, todayKey, relapses])

  const inMonth = cells.filter((c) => c && c.state !== 'none')
  const held = inMonth.filter((c) => c!.state === 'clean').length
  const fell = inMonth.filter((c) => c!.state === 'relapse').length
  const sel = selected ? fromKey(selected) : null

  const shift = (n: number) => {
    setSelected(null)
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1))
  }

  return (
    <section className="card cal">
      <div className="cal-head">
        <button className="cal-nav" onClick={() => shift(-1)} disabled={!canBack} aria-label="Vorheriger Monat">
          <IconChevronLeft size={20} />
        </button>
        <h3>{monthName(month)}</h3>
        <button className="cal-nav flip" onClick={() => shift(1)} disabled={!canForward} aria-label="Nächster Monat">
          <IconChevronLeft size={20} />
        </button>
      </div>
      <p className="cal-sum">
        <b>{held}</b> {held === 1 ? 'Tag' : 'Tage'} durchgezogen
        {inMonth.some((c) => c!.state === 'today') && ' · heute läuft'}
        {fell > 0 && (
          <>
            {' · '}
            <b className="cal-red">{fell}</b> {fell === 1 ? 'Rückfall' : 'Rückfälle'}
          </>
        )}
      </p>

      <div className="cal-grid" role="grid" aria-label={monthName(month)}>
        {WEEKDAYS.map((w) => (
          <span key={w} className="cal-wd">
            {w}
          </span>
        ))}
        {cells.map((c, i) =>
          !c ? (
            <span key={`e${i}`} />
          ) : c.state === 'none' ? (
            <span key={c.k} className="cal-day is-none">
              {c.n}
            </span>
          ) : (
            <button
              key={c.k}
              className={`cal-day is-${c.state} ${selected === c.k ? 'is-selected' : ''}`}
              onClick={() => setSelected((s) => (s === c.k ? null : c.k))}
              aria-label={`${c.n}. ${c.state === 'relapse' ? 'Rückfall' : c.state === 'today' ? 'heute, läuft' : 'durchgezogen'}`}
              aria-pressed={selected === c.k}
            >
              {c.n}
            </button>
          ),
        )}
      </div>

      <AnimatePresence initial={false}>
        {sel && selected && (
          <motion.div
            key={selected}
            className="cal-edit"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] } }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
          >
            <span>
              <b>{sel.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}</b>
              <br />
              {relapses.has(selected) ? 'Rückfall eingetragen' : selected === todayKey ? 'Läuft gerade' : 'Durchgezogen'}
            </span>
            {relapses.has(selected) ? (
              <button className="btn btn-ghost btn-sm" onClick={() => onClearRelapse(selected)}>
                Rückfall entfernen
              </button>
            ) : (
              <button className="btn btn-danger btn-sm" onClick={() => onAddRelapse(selected)}>
                Rückfall eintragen
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <p className="hint">Tippe auf einen Tag, um einen Rückfall nachzutragen oder zu entfernen.</p>
    </section>
  )
}
