import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import type { Habit } from '../lib/types'
import { IconBell, IconFlame } from './icons'

interface Props {
  habit: Habit
  done: boolean
  streak: number
  off?: boolean
  onToggle: () => void
  onOpen: () => void
}

export function HabitCard({ habit, done, streak, off, onToggle, onOpen }: Props) {
  const [burst, setBurst] = useState(0)

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
                {streak} {streak === 1 ? 'Tag' : 'Tage'}
              </span>
            ) : (
              <span className="muted">Starte deine Serie</span>
            )}
            {habit.reminder && (
              <span className="muted reminder">
                <IconBell size={12} />
                {habit.reminder}
              </span>
            )}
          </span>
        </span>
      </button>

      <motion.button
        className="check"
        whileTap={{ scale: 0.82 }}
        aria-pressed={done}
        aria-label={done ? `${habit.name} als offen markieren` : `${habit.name} abhaken`}
        onClick={() => {
          if (!done) setBurst((b) => b + 1)
          navigator.vibrate?.(done ? 8 : [12, 30, 18])
          onToggle()
        }}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
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
