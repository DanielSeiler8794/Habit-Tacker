import { useRef, useState } from 'react'
import { toKey } from '../lib/dates'
import { quitSince, TRIGGERS } from '../lib/quit'
import type { Habit, RelapseNote } from '../lib/types'

const localInput = (d: Date) =>
  `${toKey(d)}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

interface Props {
  habit: Habit
  /** Suggested time; for an edit, the relapse's current time */
  at: Date
  note?: RelapseNote
  editing?: boolean
  onSave: (at: Date, note: RelapseNote) => void
  onCancel: () => void
}

/** Entering or correcting a relapse: when it happened and, optionally, what led to it. */
export function RelapseForm({ habit, at, note, editing, onSave, onCancel }: Props) {
  const [when, setWhen] = useState(localInput(at))
  const [triggers, setTriggers] = useState<string[]>(note?.triggers ?? [])
  const [text, setText] = useState(note?.text ?? '')
  const submitted = useRef(false)
  const date = new Date(when)
  const start = quitSince(habit)
  const valid = !Number.isNaN(+date) && date >= start && date <= new Date()

  const toggle = (t: string) => setTriggers((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]))

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault()
        if (!valid || submitted.current) return
        submitted.current = true
        onSave(date, { triggers, text: text.trim() || undefined })
      }}
    >
      <h2 className="form-title">
        {editing ? 'Rückfall bearbeiten' : 'Rückfall eintragen'} · {habit.emoji} {habit.name}
      </h2>
      <p className="install-lead">Passiert. Wichtig ist, was du daraus lernst. Die Uhr startet danach neu, deine Ersparnis bleibt.</p>

      <fieldset className="field">
        <legend>Wann?</legend>
        <input id="relapse-at" type="datetime-local" className="input" value={when} min={localInput(start)} max={localInput(new Date())} onChange={(e) => setWhen(e.target.value)} />
        {!valid && <p className="hint">Der Zeitpunkt muss zwischen dem Start ({start.toLocaleDateString('de-DE')}) und jetzt liegen.</p>}
      </fieldset>

      <fieldset className="field">
        <legend>Was war der Auslöser? (optional)</legend>
        <div className="chips">
          {TRIGGERS.map((t) => (
            <button type="button" key={t} className={triggers.includes(t) ? 'is-active' : ''} onClick={() => toggle(t)} aria-pressed={triggers.includes(t)}>
              {t}
            </button>
          ))}
        </div>
        <input
          id="relapse-note"
          className="input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Notiz, z. B. Party bei Tim"
          maxLength={120}
          enterKeyHint="done"
        />
      </fieldset>

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Abbrechen
        </button>
        <button type="submit" className="btn btn-primary" disabled={!valid}>
          Speichern
        </button>
      </div>
    </form>
  )
}
