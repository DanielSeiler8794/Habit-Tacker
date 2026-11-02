import { categoryLabel } from '../lib/categories'
import { describeDays } from '../lib/dates'
import { buildIcs, downloadFile, googleCalendarUrl, inArtifact } from '../lib/reminders'
import { pausedCheck, type HabitStats } from '../lib/stats'
import type { DoneMap, Habit, Pause } from '../lib/types'
import { useMemo } from 'react'
import { ConfirmButton } from './ConfirmButton'
import { buildCells, Heatmap } from './Heatmap'
import { IconBell, IconCalendar, IconEdit, IconFlame, IconTrash } from './icons'

interface Props {
  habit: Habit
  done: DoneMap | undefined
  stats: HabitStats
  today: Date
  onToggle: (key: string) => void
  paused: Pause[]
  onArchive: (archived: boolean) => void
  onEdit: () => void
  onDelete: () => void
}

export function HabitDetail({ habit, done, stats, today, onToggle, paused, onArchive, onEdit, onDelete }: Props) {
  const cellOf = useMemo(() => buildCells(habit, done, today, pausedCheck(paused)), [habit, done, today, paused])
  const unit = (n: number) => (stats.unit === 'week' ? (n === 1 ? 'Woche' : 'Wochen') : n === 1 ? 'Tag' : 'Tage')
  const freq = habit.frequency === 'weekly' ? `${habit.timesPerWeek ?? 1}× pro Woche` : describeDays(habit.days)
  return (
    <div className="detail">
      <div className="detail-head">
        <span className="detail-emoji">{habit.emoji}</span>
        <div>
          <h2 className="detail-title">{habit.name}</h2>
          <p className="detail-sub">
            {categoryLabel(habit.category)} · {freq}
            {(habit.target ?? 1) > 1 && ` · ${habit.target} ${habit.unit ?? ''} pro Tag`}
            {habit.archivedAt && ` · geschafft am ${new Date(habit.archivedAt).toLocaleDateString('de-DE')}`}
            {habit.reminder && (
              <>
                {' · '}
                <IconBell size={13} /> {habit.reminder}
              </>
            )}
          </p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat stat-hot">
          <span className="stat-label">
            <IconFlame size={14} /> Aktuelle Serie
          </span>
          <span className="stat-value">{stats.current}</span>
          <span className="stat-unit">{unit(stats.current)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Längste Serie</span>
          <span className="stat-value">{stats.longest}</span>
          <span className="stat-unit">{unit(stats.longest)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">{stats.unit === 'week' ? 'Wochen erreicht' : 'Quote 30 Tage'}</span>
          <span className="stat-value">{Math.round(stats.rate30 * 100)}</span>
          <span className="stat-unit">%</span>
        </div>
        <div className="stat">
          <span className="stat-label">Gesamt</span>
          <span className="stat-value">{stats.total}</span>
          <span className="stat-unit">Mal</span>
        </div>
      </div>

      <section className="card">
        <div className="card-head">
          <h3>Dein Jahr</h3>
          <span className="hm-legend" aria-hidden>
            <i className="hm-cell hm-miss" /> verpasst <i className="hm-cell hm-done" /> erledigt
          </span>
        </div>
        <Heatmap today={today} cellOf={cellOf} onToggle={onToggle} />
        <p className="hint">Tippe auf einen Tag, um ihn nachzutragen.</p>
      </section>

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
        {habit.reminder && (
          <a className="btn btn-ghost" href={googleCalendarUrl(habit)} target="_blank" rel="noopener noreferrer">
            <IconCalendar size={18} /> In Google Kalender eintragen
          </a>
        )}
        {habit.reminder && !inArtifact() && (
          <button
            className="btn btn-ghost"
            onClick={() => downloadFile(`${habit.name.replace(/[^\p{L}\p{N}]+/gu, '-')}.ics`, buildIcs(habit), 'text/calendar')}
          >
            <IconCalendar size={18} /> Kalenderdatei (.ics) laden
          </button>
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
