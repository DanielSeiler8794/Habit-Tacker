import { relapsePatterns } from '../lib/quit'
import type { QuitLog } from '../lib/types'

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

/** When and why relapses happen, once there are at least two to compare. */
export function RelapsePatterns({ log }: { log: QuitLog | undefined }) {
  const p = relapsePatterns(log)
  if (p.total < 2) return null
  const maxDay = Math.max(...p.byWeekday, 1)
  const maxTrigger = Math.max(...p.triggers.map((t) => t.n), 1)

  return (
    <section className="card patterns">
      <div className="card-head">
        <h3>Deine Muster</h3>
        <span className="muted small">{p.total} Rückfälle</span>
      </div>
      {p.summary && <p className="patterns-summary">{p.summary}</p>}

      <div className="patterns-days" aria-label="Rückfälle nach Wochentag">
        {p.byWeekday.map((n, i) => (
          <div key={i} className="patterns-day">
            <span className="patterns-bar" style={{ height: `${(n / maxDay) * 100}%` }} data-empty={n === 0} />
            <span className="patterns-label">{DAYS[i]}</span>
          </div>
        ))}
      </div>

      {p.triggers.length > 0 ? (
        <ul className="patterns-triggers">
          {p.triggers.map((t) => (
            <li key={t.label}>
              <span>{t.label}</span>
              <span className="patterns-track">
                <span style={{ width: `${(t.n / maxTrigger) * 100}%` }} />
              </span>
              <b>{t.n}×</b>
            </li>
          ))}
        </ul>
      ) : (
        <p className="hint">Gib beim nächsten Rückfall den Auslöser an, dann zeigt dir die App hier, was dich am häufigsten zurückwirft.</p>
      )}
    </section>
  )
}
