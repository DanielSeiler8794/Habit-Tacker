import { motion } from 'framer-motion'
import { useState } from 'react'
import type { Habit } from '../lib/types'

/** Arrows move a habit up or down; more dependable on a phone than dragging inside a scrolling sheet. */
export function ReorderList({ habits, onSave, onCancel }: { habits: Habit[]; onSave: (ids: string[]) => void; onCancel: () => void }) {
  const [items, setItems] = useState(habits)
  const move = (i: number, by: number) =>
    setItems((cur) => {
      const j = i + by
      if (j < 0 || j >= cur.length) return cur
      const next = [...cur]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })

  return (
    <div className="form">
      <h2 className="form-title">Reihenfolge</h2>
      <p className="install-lead">Bestimme mit den Pfeilen, was im Heute-Screen oben steht.</p>
      <ul className="reorder">
        {items.map((h, i) => (
          <motion.li layout transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }} key={h.id} className="reorder-item">
            <span className="reorder-emoji">{h.emoji}</span>
            <span className="reorder-name">
              {h.name}
              <span className="muted small">{h.kind === 'quit' ? 'Abgewöhnen' : 'Aufbauen'}</span>
            </span>
            <span className="reorder-arrows">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`${h.name} nach oben`}>
                ↑
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label={`${h.name} nach unten`}>
                ↓
              </button>
            </span>
          </motion.li>
        ))}
      </ul>
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Abbrechen
        </button>
        <button type="button" className="btn btn-primary" onClick={() => onSave(items.map((h) => h.id))}>
          Speichern
        </button>
      </div>
    </div>
  )
}
