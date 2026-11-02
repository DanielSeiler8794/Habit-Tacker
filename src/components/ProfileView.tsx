import { motion } from 'framer-motion'
import { BADGES, isUnlocked, type Summary } from '../lib/gamification'
import { formatEuro, formatKcal, formatMinutes, isQuit, totalEuro } from '../lib/quit'
import type { AppState } from '../lib/types'
import { MonthReview } from './MonthReview'
import { IconFlame } from './icons'
import { SavingsCard } from './SavingsCard'

interface Props {
  summary: Summary
  state: AppState
  now: Date
  onOpen: (id: string) => void
}

export function ProfileView({ summary, state, now, onOpen }: Props) {
  const habits = state.habits
  const unlocked = BADGES.filter((b) => isUnlocked(b, summary)).length
  const quitHabits = habits.filter((h) => isQuit(h) && !h.archivedAt)
  const archived = habits.filter((h) => h.archivedAt)
  return (
    <div className="view">
      <header className="top">
        <div>
          <p className="eyebrow">Was du erreicht hast</p>
          <h1 className="title">Erfolge</h1>
        </div>
      </header>

      {quitHabits.length > 0 && <SavingsCard title="Gesamt gespart" saved={summary.saved} />}

      {quitHabits.length > 1 && (
        <section className="card">
          <div className="card-head">
            <h3>Nach Gewohnheit</h3>
          </div>
          <ul className="saved-list">
            {quitHabits.map((h) => {
              const s = summary.perQuit[h.id]?.saved
              if (!s) return null
              return (
                <li key={h.id}>
                  <span className="saved-list-name">
                    {h.emoji} {h.name}
                  </span>
                  <span className="saved-list-value">
                    {totalEuro(s) > 0 ? formatEuro(totalEuro(s)) : s.kcal > 0 ? formatKcal(s.kcal) : '–'}
                    {s.minutes > 0 && <small>{formatMinutes(s.minutes)}</small>}
                    {s.kcal > 0 && totalEuro(s) > 0 && <small>{formatKcal(s.kcal)}</small>}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <MonthReview state={state} now={now} />

      {archived.length > 0 && (
        <section className="card">
          <div className="card-head">
            <h3>🏁 Geschafft</h3>
            <span className="count">{archived.length}</span>
          </div>
          <ul className="saved-list">
            {archived.map((h) => {
              const q = summary.perQuit[h.id]
              const b = summary.perHabit[h.id]
              const line = q
                ? `${q.longestDays} Tage längste Phase${totalEuro(q.saved) > 0 ? ` · ${formatEuro(totalEuro(q.saved))} gespart` : ''}`
                : b
                  ? `${b.total}× erledigt · Serie bis ${b.longest} ${b.unit === 'week' ? 'Wochen' : 'Tage'}`
                  : ''
              return (
                <li key={h.id}>
                  <button className="archived-row" onClick={() => onOpen(h.id)}>
                    <span className="saved-list-name">
                      {h.emoji} {h.name}
                    </span>
                    <span className="muted small">{line}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <div className="mini-stats">
        <div>
          <span className="mini-value">{summary.cleanDaysTotal.toLocaleString('de-DE')}</span>
          <span className="mini-label">Tage durchgezogen</span>
        </div>
        <div>
          <span className="mini-value hot">
            <IconFlame size={16} />
            {summary.bestClean}
          </span>
          <span className="mini-label">Längste Phase ohne Rückfall</span>
        </div>
        <div>
          <span className="mini-value">{summary.totalDone.toLocaleString('de-DE')}</span>
          <span className="mini-label">Gute Gewohnheiten erledigt</span>
        </div>
        <div>
          <span className="mini-value">{summary.perfectDays}</span>
          <span className="mini-label">Perfekte Tage</span>
        </div>
      </div>

      <div className="section-head">
        <h2>Abzeichen</h2>
        <span className="count">
          {unlocked}/{BADGES.length}
        </span>
      </div>
      <div className="badge-grid">
        {BADGES.map((b, i) => {
          const [cur, target] = b.progress(summary)
          const on = cur >= target
          return (
            <motion.div key={b.id} className={`badge ${on ? 'is-on' : ''}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <span className="badge-emoji">{b.emoji}</span>
              <span className="badge-title">{b.title}</span>
              <span className="badge-desc">{b.desc}</span>
              {!on && (
                <span className="badge-progress" aria-label={`${cur} von ${target}`}>
                  <span style={{ width: `${(cur / target) * 100}%` }} />
                </span>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
