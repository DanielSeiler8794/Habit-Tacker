import { useEffect, useMemo, useRef } from 'react'
import { addDays, fromKey, MONTH_SHORT, toKey } from '../lib/dates'
import { isScheduled } from '../lib/stats'
import type { DoneMap, Habit } from '../lib/types'

export interface Cell {
  kind: 'done' | 'miss' | 'off' | 'pre'
  /** 0..1, how strongly a done day glows */
  strength?: number
  label?: string
}

interface Props {
  today: Date
  cellOf: (d: Date, k: string) => Cell
  /** Cells are tappable only when this is given */
  onToggle?: (key: string) => void
}

const WEEKS = 53

/** Good habit: done days get brighter the longer the streak runs. */
export function buildCells(habit: Habit, done: DoneMap | undefined, today: Date) {
  const tKey = toKey(today)
  const created = fromKey(habit.createdAt)
  const run = new Map<string, number>()
  let r = 0
  for (let d = created; d <= today; d = addDays(d, 1)) {
    const k = toKey(d)
    if (!isScheduled(habit, d)) {
      if (done?.[k]) run.set(k, Math.max(r, 1))
      continue
    }
    if (done?.[k]) r++
    else if (k !== tKey) r = 0
    if (done?.[k]) run.set(k, r)
  }
  return (d: Date, k: string): Cell => {
    if (done?.[k]) return { kind: 'done', strength: Math.min(run.get(k) ?? 1, 14) / 14, label: 'erledigt' }
    if (d < created) return { kind: 'pre' }
    if (isScheduled(habit, d) && k !== tKey) return { kind: 'miss', label: 'verpasst' }
    return { kind: 'off' }
  }
}

export function Heatmap({ today, cellOf, onToggle }: Props) {
  const scroller = useRef<HTMLDivElement>(null)

  const { weeks, months } = useMemo(() => {
    const mondayOffset = (today.getDay() + 6) % 7
    const start = addDays(today, -mondayOffset - (WEEKS - 1) * 7)
    const tKey = toKey(today)
    const weeks = Array.from({ length: WEEKS }, (_, w) =>
      Array.from({ length: 7 }, (_, i) => {
        const d = addDays(start, w * 7 + i)
        const k = toKey(d)
        return { k, d, future: d > today, isToday: k === tKey, cell: d > today ? null : cellOf(d, k) }
      }),
    )
    const months = weeks.map((week) => {
      const first = week.find((c) => c.d.getDate() === 1)
      return first ? MONTH_SHORT[first.d.getMonth()] : ''
    })
    return { weeks, months }
  }, [today, cellOf])

  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [])

  return (
    <div className="heatmap">
      <div className="hm-days" aria-hidden>
        <span>Mo</span>
        <span />
        <span>Mi</span>
        <span />
        <span>Fr</span>
        <span />
        <span>So</span>
      </div>
      <div className="hm-scroll" ref={scroller}>
        <div className="hm-months" aria-hidden>
          {months.map((m, i) => (
            <span key={i}>{m}</span>
          ))}
        </div>
        <div className="hm-grid">
          {weeks.map((week, w) => (
            <div className="hm-col" key={w}>
              {week.map((c) => {
                if (!c.cell) return <span key={c.k} className="hm-cell hm-future" />
                const cls = `hm-cell hm-${c.cell.kind} ${c.isToday ? 'hm-today' : ''}`
                const style = c.cell.kind === 'done' ? { opacity: 0.45 + (c.cell.strength ?? 0) * 0.55 } : undefined
                const title = `${c.d.toLocaleDateString('de-CH', { weekday: 'short', day: 'numeric', month: 'short' })}${c.cell.label ? ` · ${c.cell.label}` : ''}`
                return onToggle ? (
                  <button key={c.k} className={cls} style={style} title={title} aria-label={title} onClick={() => onToggle(c.k)} />
                ) : (
                  <span key={c.k} className={cls} style={style} title={title} />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
