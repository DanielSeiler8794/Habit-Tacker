import { categoryLabel } from '../lib/categories'
import { quitSince, type QuitStats } from '../lib/quit'
import type { Habit, QuitLog } from '../lib/types'
import { ConfirmButton } from './ConfirmButton'
import { IconEdit, IconFlame, IconTrash } from './icons'
import { QuitCalendar } from './QuitCalendar'
import { Milestones } from './Milestones'
import { RelapsePatterns } from './RelapsePatterns'
import { SavingsCard } from './SavingsCard'

interface Props {
  habit: Habit
  log: QuitLog | undefined
  stats: QuitStats
  now: Date
  onAddRelapse: (key: string) => void
  onEditRelapse: (key: string) => void
  onClearRelapse: (key: string) => void
  onArchive: (archived: boolean) => void
  onEdit: () => void
  onDelete: () => void
}

export function QuitDetail({ habit, log, stats, now, onAddRelapse, onEditRelapse, onClearRelapse, onArchive, onEdit, onDelete }: Props) {
  const since = quitSince(habit).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="detail">
      <div className="detail-head">
        <span className="detail-emoji">{habit.emoji}</span>
        <div>
          <h2 className="detail-title">{habit.name}</h2>
          <p className="detail-sub">
            {categoryLabel(habit.category)} · {habit.archivedAt ? `Geschafft am ${new Date(habit.archivedAt).toLocaleDateString('de-DE')}` : `Abgewöhnen seit ${since}`}
          </p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat stat-hot">
          <span className="stat-label">
            <IconFlame size={14} /> Ohne Rückfall
          </span>
          <span className="stat-value">{stats.currentDays}</span>
          <span className="stat-unit">{stats.currentDays === 1 ? 'Tag' : 'Tage'}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Längste Phase</span>
          <span className="stat-value">{stats.longestDays}</span>
          <span className="stat-unit">Tage</span>
        </div>
        <div className="stat">
          <span className="stat-label">Durchgezogen</span>
          <span className="stat-value">{stats.cleanDays}</span>
          <span className="stat-unit">Tage gesamt</span>
        </div>
        <div className="stat">
          <span className="stat-label">Rückfälle</span>
          <span className="stat-value">{stats.relapses}</span>
          <span className="stat-unit">gesamt</span>
        </div>
      </div>

      <SavingsCard title="Gespart" saved={stats.saved} habit={habit} />

      {!habit.archivedAt && <Milestones habit={habit} currentDays={stats.currentDays} />}

      <QuitCalendar
        habit={habit}
        log={log}
        now={now}
        onAddRelapse={onAddRelapse}
        onEditRelapse={onEditRelapse}
        onClearRelapse={onClearRelapse}
      />

      <RelapsePatterns log={log} />

      <div className="detail-actions">
        {habit.archivedAt ? (
          <button className="btn btn-ghost" onClick={() => onArchive(false)}>
            Wieder aufnehmen
          </button>
        ) : (
          <ConfirmButton className="btn btn-ghost" confirmLabel="Wirklich als geschafft markieren?" onConfirm={() => onArchive(true)}>
            🏁 Geschafft – zu den Erfolgen
          </ConfirmButton>
        )}
        <button className="btn btn-ghost" onClick={onEdit}>
          <IconEdit size={18} /> Bearbeiten
        </button>
        <ConfirmButton className="btn btn-danger" confirmLabel="Wirklich löschen? Nochmal tippen" onConfirm={onDelete}>
          <IconTrash size={18} /> Löschen
        </ConfirmButton>
      </div>
    </div>
  )
}
