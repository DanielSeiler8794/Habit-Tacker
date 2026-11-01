import { motion } from 'framer-motion'
import { addDays, toKey, WEEKDAY_SHORT } from '../lib/dates'
import { habitsForDay } from '../lib/stats'
import type { AppState } from '../lib/types'

interface Props {
  state: AppState
  today: Date
  selected: string
  onSelect: (key: string) => void
}

export function WeekStrip({ state, today, selected, onSelect }: Props) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6))
  return (
    <div className="week-strip" role="tablist" aria-label="Letzte 7 Tage">
      {days.map((d) => {
        const k = toKey(d)
        const list = habitsForDay(state, d)
        const doneCount = list.filter((h) => state.done[h.id]?.[k]).length
        const ratio = list.length ? doneCount / list.length : 0
        const active = k === selected
        const perfect = list.length > 0 && ratio === 1
        return (
          <button
            key={k}
            role="tab"
            aria-selected={active}
            className={`week-day ${active ? 'is-active' : ''} ${perfect ? 'is-perfect' : ''}`}
            onClick={() => onSelect(k)}
          >
            {active && <motion.span layoutId="week-active" className="week-active" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
            <span className="week-label">{WEEKDAY_SHORT[d.getDay()]}</span>
            <span className="week-num">{d.getDate()}</span>
            <span className="week-bar" aria-hidden>
              <span style={{ width: `${ratio * 100}%` }} />
            </span>
          </button>
        )
      })}
    </div>
  )
}
