import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import type { Habit } from '../lib/types'
import { IconBell, IconFlame } from './icons'

interface Props {
  habit: Habit
  done: boolean
  streak: number
  streakUnit?: 'day' | 'week'
  /** Extra line, e.g. "2 von 3 diese Woche" or "Pause" */
  note?: string
  /** Amount so far today, for habits with a target */
  count?: number
  off?: boolean
  onToggle: () => void
  /** Habits with a target count up instead of ticking */
  onCount?: (delta: number) => void
  onOpen: () => void
}

export function HabitCard({ habit, done, streak, streakUnit = 'day', note, count = 0, off, onToggle, onCount, onOpen }: Props) {
  const [burst, setBurst] = useState(0)
  const target = habit.target ?? 1
  const counting = target > 1 && !!onCount
  const unitLabel = (n: number) => (streakUnit === 'week' ? (n === 1 ? 'Woche' : 'Wochen') : n === 1 ? 'Tag' : 'Tage')

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      className={`habit-card ${done ? 'is-done' : ''} ${off ? 'is-off' : ''}`}
    >
      <button className="habit-main" onClick={onOpen} aria-label={`${habit.name} öffnen`}>
        <motion.span className="habit-emoji" animate={done ? { scale: [1, 1.18, 1] } : { scale: 1 }} transition={{ duration: 0.4 }}>
          {habit.emoji}
        </motion.span>
        <span className="habit-meta">
          <span className="habit-name">{habit.name}</span>
          <span className="habit-sub">
            {streak > 0 ? (
              <span className={`streak ${streak >= 7 ? 'is-hot' : ''}`}>
                <IconFlame size={14} />
                {streak} {unitLabel(streak)}
              </span>
            ) : note ? null : (
              <span className="muted">Starte deine Serie</span>
            )}
            {habit.reminder && (
              <span className="muted reminder">
                <IconBell size={12} />
                {habit.reminder}
              </span>
            )}
            {note && <span className="muted">{note}</span>}
            {counting && !done && (
              <span className="muted">
                {count}/{target} {habit.unit ?? ''}
              </span>
            )}
          </span>
        </span>
      </button>

      {counting && count > 0 && !off && (
        <button className="count-minus" onClick={() => onCount!(-1)} aria-label={`${habit.name}: eins weniger`}>
          −
        </button>
      )}

      <motion.button
        className={`check ${counting && !done && count > 0 ? 'is-partial' : ''}`}
        style={counting && !done ? ({ '--fill': `${(count / target) * 360}deg` } as React.CSSProperties) : undefined}
        whileTap={{ scale: 0.82 }}
        aria-pressed={done}
        aria-label={counting && !done ? `${habit.name}: eins mehr, ${count} von ${target}` : done ? `${habit.name} als offen markieren` : `${habit.name} abhaken`}
        onClick={() => {
          if (!done && (!counting || count + 1 >= target)) setBurst((b) => b + 1)
          navigator.vibrate?.(done ? 8 : [12, 30, 18])
          if (counting && !done) onCount!(1)
          else if (counting) onCount!(-count)
          else onToggle()
        }}
      >
        {counting && !done && <span className="check-plus" aria-hidden>+</span>}
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden style={counting && !done ? { position: 'absolute' } : undefined}>
          <motion.path
            d="M5 12.5l4.5 4.5L19 7.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{ pathLength: done ? 1 : 0, opacity: done ? 1 : 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />
        </svg>
        <AnimatePresence>
          {burst > 0 && done && (
            <motion.span
              key={burst}
              className="check-pulse"
              initial={{ scale: 0.6, opacity: 0.8 }}
              animate={{ scale: 2.1, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>
      </motion.button>

    </motion.div>
  )
}
