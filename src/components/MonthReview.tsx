import { useMemo, useState } from 'react'
import { formatEuro, formatKcal, formatMinutes } from '../lib/quit'
import { monthReport } from '../lib/report'
import type { AppState } from '../lib/types'
import { IconChevronLeft } from './icons'

const monthName = (d: Date, opts: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' }) => d.toLocaleDateString('de-DE', opts)

/** "+12 gegenüber Oktober" style difference; nothing when there is no previous data. */
function delta(now: number, before: number, format: (n: number) => string) {
  if (!before && !now) return null
  const d = now - before
  if (Math.abs(d) < 0.5) return 'wie im Vormonat'
  return `${d > 0 ? '+' : '−'}${format(Math.abs(d))} zum Vormonat`
}

/** One month at a glance with the change to the month before, plus the last six months as bars. */
export function MonthReview({ state, now }: { state: AppState; now: Date }) {
  const [offset, setOffset] = useState(0)
  const month = new Date(now.getFullYear(), now.getMonth() - offset, 1)

  const reports = useMemo(
    () => Array.from({ length: 6 }, (_, i) => monthReport(state, new Date(month.getFullYear(), month.getMonth() - 5 + i, 1), now)),
    [state, month.getFullYear(), month.getMonth(), now],
  )
  const cur = reports[5]
  const prev = reports[4]
  const byEuro = reports.some((r) => r.euro > 0)
  const value = (r: (typeof reports)[number]) => (byEuro ? r.euro : r.cleanDays)
  const max = Math.max(...reports.map(value), 1)

  return (
    <section className="card month">
      <div className="cal-head">
        <button className="cal-nav" onClick={() => setOffset((o) => o + 1)} disabled={offset >= 23} aria-label="Vorheriger Monat">
          <IconChevronLeft size={20} />
        </button>
        <h3>{monthName(month)}</h3>
        <button className="cal-nav flip" onClick={() => setOffset((o) => Math.max(0, o - 1))} disabled={offset === 0} aria-label="Nächster Monat">
          <IconChevronLeft size={20} />
        </button>
      </div>

      <div className="month-stats">
        <div>
          <span className="mini-value">{formatEuro(cur.euro)}</span>
          <span className="mini-label">gespart</span>
          <span className="month-delta">{delta(cur.euro, prev.euro, formatEuro)}</span>
        </div>
        <div>
          <span className="mini-value">{cur.cleanDays}</span>
          <span className="mini-label">Tage ohne Rückfall</span>
          <span className="month-delta">{delta(cur.cleanDays, prev.cleanDays, (n) => `${Math.round(n)}`)}</span>
        </div>
        <div>
          <span className="mini-value">{cur.relapses}</span>
          <span className="mini-label">Rückfälle</span>
          <span className="month-delta">{delta(cur.relapses, prev.relapses, (n) => `${Math.round(n)}`)}</span>
        </div>
        <div>
          <span className="mini-value">{cur.goodDone}</span>
          <span className="mini-label">gute Gewohnheiten</span>
          <span className="month-delta">{delta(cur.goodDone, prev.goodDone, (n) => `${Math.round(n)}`)}</span>
        </div>
      </div>
      {(cur.saved.minutes > 0 || cur.saved.kcal > 0) && (
        <p className="hint">
          Ausserdem gespart: {[cur.saved.minutes > 0 && formatMinutes(cur.saved.minutes), cur.saved.kcal > 0 && formatKcal(cur.saved.kcal)].filter(Boolean).join(' · ')}
        </p>
      )}

      <div className="month-bars" aria-label={byEuro ? 'Ersparnis der letzten sechs Monate' : 'Tage ohne Rückfall der letzten sechs Monate'}>
        {reports.map((r, i) => (
          <div key={i} className={`month-bar ${i === 5 ? 'is-current' : ''}`}>
            <span className="month-bar-value">{value(r) > 0 ? (byEuro ? formatEuro(r.euro).replace(' €', '') : r.cleanDays) : ''}</span>
            <span className="month-bar-fill" style={{ height: `${(value(r) / max) * 100}%` }} />
            <span className="month-bar-label">{monthName(r.month, { month: 'short' })}</span>
          </div>
        ))}
      </div>
      <p className="hint center">{byEuro ? 'Ersparnis in € pro Monat' : 'Tage ohne Rückfall pro Monat'}</p>
    </section>
  )
}
