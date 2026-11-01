import { motion } from 'framer-motion'
import { formatClean, savingsLine, type QuitStats } from '../lib/quit'
import type { Habit } from '../lib/types'
import { ConfirmButton } from './ConfirmButton'

interface Props {
  habit: Habit
  stats: QuitStats
  onRelapse: () => void
  onOpen: () => void
}

/** Runs on its own: the clock and the saved amount grow without input; only a relapse is entered. */
export function QuitCard({ habit, stats, onRelapse, onOpen }: Props) {
  const saved = savingsLine(stats.saved)

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

      {stats.nextMilestone && (
        <div className="quit-goal">
          <span className="quit-goal-bar" aria-hidden>
            <motion.span initial={false} animate={{ width: `${Math.min(stats.milestoneProgress, 1) * 100}%` }} />
          </span>
          <span className="quit-goal-text">Nächstes Ziel: {stats.nextMilestone} {stats.nextMilestone === 1 ? 'Tag' : 'Tage'}</span>
        </div>
      )}

      <div className="quit-bottom">
        <p className="quit-foot">{saved ?? 'Läuft automatisch weiter'}</p>
        <ConfirmButton className="btn btn-ghost btn-sm" confirmLabel="Wirklich eintragen?" onConfirm={onRelapse}>
          Rückfall
        </ConfirmButton>
      </div>
    </motion.div>
  )
}
