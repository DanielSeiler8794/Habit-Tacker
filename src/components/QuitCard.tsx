import { motion } from 'framer-motion'
import { formatClean, formatEuro, savingsLine, totalEuro, type QuitStats } from '../lib/quit'
import type { Habit } from '../lib/types'

interface Props {
  habit: Habit
  stats: QuitStats
  onRelapse: () => void
  onOpen: () => void
}

/** Runs on its own: the clock and the saved amount grow without input; only a relapse is entered. */
export function QuitCard({ habit, stats, onRelapse, onOpen }: Props) {
  const saved = savingsLine(stats.saved)
  const euro = totalEuro(stats.saved)
  const goal = habit.goalName && habit.goalEuro ? Math.min(1, euro / habit.goalEuro) : null
  const next = stats.nextMilestone
  const daysToNext = next ? Math.max(1, Math.ceil(next.days - stats.currentMs / 86_400_000)) : 0

  return (
    <motion.div layout className="quit-card">
      <button className="quit-head" onClick={onOpen} aria-label={`${habit.name} öffnen`}>
        <span className="habit-emoji">{habit.emoji}</span>
        <span className="habit-meta">
          <span className="habit-name">{habit.name}</span>
          <span className="habit-sub muted">
            {stats.cleanDays === 1 ? '1 Tag durchgezogen' : `${stats.cleanDays} Tage durchgezogen`}
            {stats.relapses > 0 && ` · ${stats.relapses} ${stats.relapses === 1 ? 'Rückfall' : 'Rückfälle'}`}
          </span>
        </span>
      </button>

      <div className="quit-clock">
        <span className="quit-time">{formatClean(stats.currentMs)}</span>
        <span className="quit-caption">ohne Rückfall</span>
      </div>

      {next && (
        <div className="quit-goal">
          <span className="quit-goal-bar" aria-hidden>
            <motion.span initial={false} animate={{ width: `${Math.min(stats.milestoneProgress, 1) * 100}%` }} />
          </span>
          <span className="quit-goal-text">
            In {daysToNext} {daysToNext === 1 ? 'Tag' : 'Tagen'}: {next.title}
          </span>
        </div>
      )}

      {goal !== null && (
        <p className="quit-target">
          {goal >= 1 ? '🎉 ' : ''}Sparziel {habit.goalName}: {formatEuro(Math.min(euro, habit.goalEuro!))} von {formatEuro(habit.goalEuro!)}
          <span className="quit-target-bar" aria-hidden>
            <motion.span initial={false} animate={{ width: `${goal * 100}%` }} />
          </span>
        </p>
      )}

      <div className="quit-bottom">
        <p className="quit-foot">{saved ?? 'Läuft automatisch weiter'}</p>
        <button className="btn btn-ghost btn-sm" onClick={onRelapse}>
          Rückfall
        </button>
      </div>
    </motion.div>
  )
}
