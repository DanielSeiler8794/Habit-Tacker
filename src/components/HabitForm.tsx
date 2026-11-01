import { motion } from 'framer-motion'
import { useState } from 'react'
import { CATEGORIES, DEFAULT_CATEGORY } from '../lib/categories'
import { ALL_DAYS, toKey, WEEK_ORDER, WEEKDAY_SHORT } from '../lib/dates'
import { notificationsSupported, requestNotifications } from '../lib/reminders'
import type { Habit, HabitKind, SaveKind } from '../lib/types'

const BUILD_EMOJIS = ['💧', '📚', '🏃', '🧘', '🌙', '🥗', '💪', '🚴', '✍️', '🎸', '🧠', '💊', '🛏️', '☀️', '🍎', '🧹', '💰', '🌿', '🎯', '🫁', '🐕', '❤️', '🦷', '🚶']
const QUIT_EMOJIS = ['🚬', '🍺', '🍷', '🍫', '🍟', '🥤', '☕', '📱', '🎮', '📺', '🛒', '🎰', '💸', '😤', '💅', '⏰', '🍬', '🍕', '🌭', '🛋️', '🧃', '🥃', '🍔', '💬']

/** "YYYY-MM-DDTHH:MM" in local time, as datetime-local inputs expect */
const localInput = (d: Date) => `${toKey(d)}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

interface Props {
  habit: Habit | null
  onSave: (h: Habit) => void
  onCancel: () => void
}

export function HabitForm({ habit, onSave, onCancel }: Props) {
  const [kind, setKind] = useState<HabitKind>(habit?.kind ?? 'quit')
  const [name, setName] = useState(habit?.name ?? '')
  const [emoji, setEmoji] = useState(habit?.emoji ?? QUIT_EMOJIS[0])
  const [category, setCategory] = useState(habit?.category ?? DEFAULT_CATEGORY)
  const [days, setDays] = useState<number[]>(habit?.days ?? ALL_DAYS)
  const [mode, setMode] = useState<'daily' | 'custom'>(habit && habit.days.length < 7 ? 'custom' : 'daily')
  const [reminderOn, setReminderOn] = useState(!!habit?.reminder)
  const [time, setTime] = useState(habit?.reminder ?? '08:00')
  const [since, setSince] = useState(localInput(habit?.quitSince ? new Date(habit.quitSince) : new Date()))
  const [money, setMoney] = useState(habit?.costMoney ? String(habit.costMoney) : '')
  const [minutes, setMinutes] = useState(habit?.costMinutes ? String(habit.costMinutes) : '')
  const [saves, setSaves] = useState<SaveKind[]>(habit?.saves ?? ['money'])
  const [kcal, setKcal] = useState(habit?.costKcal ? String(habit.costKcal) : '')
  const has = (k: SaveKind) => saves.includes(k)
  const toggleSave = (k: SaveKind) => setSaves((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]))
  const [hourValue, setHourValue] = useState(habit?.hourValue ? String(habit.hourValue) : '')
  const [hourFactor, setHourFactor] = useState(habit?.hourFactor ? String(habit.hourFactor) : '')
  const [factorLabel, setFactorLabel] = useState(habit?.factorLabel ?? '')
  const [permission, setPermission] = useState(notificationsSupported() ? Notification.permission : 'denied')

  const quit = kind === 'quit'
  const emojis = quit ? QUIT_EMOJIS : BUILD_EMOJIS
  const effectiveDays = quit || mode === 'daily' ? ALL_DAYS : days
  const sinceDate = new Date(since)
  const sinceValid = !quit || (!Number.isNaN(+sinceDate) && sinceDate <= new Date())
  const valid = name.trim().length > 0 && effectiveDays.length > 0 && sinceValid

  const toggleDay = (d: number) => setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]))
  const switchKind = (k: HabitKind) => {
    setKind(k)
    if (!habit) setEmoji((k === 'quit' ? QUIT_EMOJIS : BUILD_EMOJIS)[0])
  }
  const enableReminder = async (on: boolean) => {
    setReminderOn(on)
    if (on) setPermission(await requestNotifications())
  }
  const num = (v: string) => {
    const n = Number(v.replace(',', '.'))
    return Number.isFinite(n) && n > 0 ? n : undefined
  }

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault()
        if (!valid) return
        const base = { id: habit?.id ?? `h-${Date.now().toString(36)}`, name: name.trim(), emoji, kind, category }
        onSave(
          quit
            ? {
                ...base,
                days: ALL_DAYS,
                reminder: null,
                createdAt: toKey(sinceDate),
                quitSince: sinceDate.toISOString(),
                saves,
                saveMode: undefined,
                costMoney: has('money') ? num(money) : undefined,
                costMinutes: has('time') ? num(minutes) : undefined,
                costKcal: has('kcal') ? num(kcal) : undefined,
                hourValue: has('time') ? num(hourValue) : undefined,
                hourFactor: has('time') ? num(hourFactor) : undefined,
                factorLabel: has('time') && num(hourFactor) ? factorLabel.trim() || undefined : undefined,
              }
            : { ...base, days: [...effectiveDays].sort(), reminder: reminderOn ? time : null, createdAt: habit?.createdAt ?? toKey(new Date()) },
        )
      }}
    >
      <h2 className="form-title">{habit ? 'Bearbeiten' : 'Neue Gewohnheit'}</h2>

      {!habit && (
        <div className="segmented" role="radiogroup" aria-label="Art">
          {(['quit', 'build'] as const).map((k) => (
            <button type="button" role="radio" aria-checked={kind === k} key={k} className={kind === k ? 'is-active' : ''} onClick={() => switchKind(k)}>
              {kind === k && <motion.span layoutId="seg-kind" className="seg-pill" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
              <span>{k === 'quit' ? 'Abgewöhnen' : 'Aufbauen'}</span>
            </button>
          ))}
        </div>
      )}

      <div className="name-row">
        <span className="name-emoji">{emoji}</span>
        <input
          id="habit-name"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={quit ? 'z. B. Rauchen' : 'z. B. 20 Minuten lesen'}
          aria-label="Name"
          maxLength={40}
          autoFocus={!habit}
          enterKeyHint="done"
        />
      </div>

      <fieldset className="field">
        <legend>Kategorie</legend>
        <div className="chips">
          {CATEGORIES.map((c) => (
            <button type="button" key={c.id} className={category === c.id ? 'is-active' : ''} onClick={() => setCategory(c.id)} aria-pressed={category === c.id}>
              {c.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="field">
        <legend>Symbol</legend>
        <div className="emoji-grid">
          {emojis.map((e) => (
            <button type="button" key={e} className={`emoji-opt ${e === emoji ? 'is-active' : ''}`} onClick={() => setEmoji(e)} aria-label={`Symbol ${e}`} aria-pressed={e === emoji}>
              {e}
            </button>
          ))}
        </div>
      </fieldset>

      {quit ? (
        <>
          <fieldset className="field">
            <legend>Ohne Rückfall seit</legend>
            <input id="quit-since" type="datetime-local" className="input" value={since} max={localInput(new Date())} onChange={(e) => setSince(e.target.value)} />
            {!sinceValid && <p className="hint">Wähle einen Zeitpunkt, der nicht in der Zukunft liegt.</p>}
          </fieldset>
          <fieldset className="field">
            <legend>Was sparst du pro Tag ohne Rückfall?</legend>
            <div className="chips" role="group" aria-label="Was sparst du">
              {(
                [
                  ['money', 'Geld'],
                  ['time', 'Zeit'],
                  ['kcal', 'Kalorien'],
                ] as const
              ).map(([k, label]) => (
                <button type="button" key={k} className={has(k) ? 'is-active' : ''} onClick={() => toggleSave(k)} aria-pressed={has(k)}>
                  {label}
                </button>
              ))}
            </div>
            <div className="cost-row">
              {has('money') && (
                <label className="cost">
                  <input id="cost-money" className="input" inputMode="decimal" value={money} onChange={(e) => setMoney(e.target.value)} placeholder="0" aria-label="Euro pro Tag" />
                  <span>€ / Tag</span>
                </label>
              )}
              {has('time') && (
                <label className="cost">
                  <input id="cost-minutes" className="input" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="0" aria-label="Minuten pro Tag" />
                  <span>Min. / Tag</span>
                </label>
              )}
              {has('kcal') && (
                <label className="cost">
                  <input id="cost-kcal" className="input" inputMode="numeric" value={kcal} onChange={(e) => setKcal(e.target.value)} placeholder="0" aria-label="Kalorien pro Tag" />
                  <span>kcal / Tag</span>
                </label>
              )}
            </div>
            <p className="hint">Wähle alles, was zutrifft. Zum Beispiel bei Süssigkeiten: 2 € und 400 kcal pro Tag. Jeder Tag ohne Rückfall wird automatisch gutgeschrieben.</p>
          </fieldset>

          {has('time') && (
            <fieldset className="field">
              <legend>Was ist dir eine gesparte Stunde wert? (optional)</legend>
              <label className="cost">
                <input id="hour-value" className="input" inputMode="decimal" value={hourValue} onChange={(e) => setHourValue(e.target.value)} placeholder="z. B. 30" aria-label="Wert einer Stunde in Euro" />
                <span>€ / Std</span>
              </label>
              <div className="factor-row">
                <span>1 Std entspricht</span>
                <input id="hour-factor" className="input factor" inputMode="decimal" value={hourFactor} onChange={(e) => setHourFactor(e.target.value)} placeholder="10" aria-label="Faktor" />
                <span>Std</span>
                <input id="factor-label" className="input" value={factorLabel} onChange={(e) => setFactorLabel(e.target.value)} placeholder="Lernen" aria-label="Wofür" maxLength={24} />
              </div>
              <p className="hint">Der Stundenwert ist z. B. deine interne Arbeitsstunde. Der Faktor zeigt, was du in der Zeit Produktiveres schaffen könntest.</p>
            </fieldset>
          )}
        </>
      ) : (
        <>
          <fieldset className="field">
            <legend>Wie oft?</legend>
            <div className="segmented">
              {(['daily', 'custom'] as const).map((m) => (
                <button type="button" key={m} className={mode === m ? 'is-active' : ''} onClick={() => setMode(m)}>
                  {mode === m && <motion.span layoutId="seg" className="seg-pill" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                  <span>{m === 'daily' ? 'Täglich' : 'Bestimmte Tage'}</span>
                </button>
              ))}
            </div>
            {mode === 'custom' && (
              <div className="day-pills">
                {WEEK_ORDER.map((d) => (
                  <button type="button" key={d} className={days.includes(d) ? 'is-active' : ''} onClick={() => toggleDay(d)} aria-pressed={days.includes(d)}>
                    {WEEKDAY_SHORT[d]}
                  </button>
                ))}
              </div>
            )}
          </fieldset>

          <fieldset className="field">
            <legend>Erinnerung</legend>
            <div className="reminder-row">
              <label className="switch">
                <input type="checkbox" checked={reminderOn} onChange={(e) => enableReminder(e.target.checked)} />
                <span className="switch-track" />
                <span>{reminderOn ? 'An' : 'Aus'}</span>
              </label>
              {reminderOn && <input type="time" className="input time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Uhrzeit" />}
            </div>
            {reminderOn && permission !== 'granted' && (
              <p className="hint">Benachrichtigungen sind blockiert. Über „In Google Kalender eintragen“ in der Detailansicht erinnert dich dein Kalender trotzdem zuverlässig.</p>
            )}
          </fieldset>
        </>
      )}

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Abbrechen
        </button>
        <button type="submit" className="btn btn-primary" disabled={!valid}>
          {habit ? 'Speichern' : 'Anlegen'}
        </button>
      </div>
    </form>
  )
}
