import { AnimatePresence, motion } from 'framer-motion'
import { categoryStats } from '../lib/categories'
import { formatLong, fromKey, greeting, toKey } from '../lib/dates'
import type { Summary } from '../lib/gamification'
import { formatEuro, formatKcal, formatMinutes, isQuit, totalEuro } from '../lib/quit'
import { addDays } from '../lib/dates'
import { isArchived, isPlannedOn, isWeekly, pausedCheck, weekStart } from '../lib/stats'
import type { AppState } from '../lib/types'
import { CategoryStreaks } from './CategoryStreaks'
import { HabitCard } from './HabitCard'
import { InstallHint } from './InstallHint'
import { IconPlus } from './icons'
import { ProgressRing } from './ProgressRing'
import { QuitCard } from './QuitCard'
import { WeekStrip } from './WeekStrip'

interface Props {
  state: AppState
  summary: Summary
  now: Date
  today: Date
  selected: string
  onSelect: (key: string) => void
  onToggle: (id: string, key: string) => void
  onCount: (id: string, key: string, delta: number) => void
  onRelapse: (id: string) => void
  onOpen: (id: string) => void
  onAdd: () => void
  onToast: (message: string) => void
}

export function TodayView(p: Props) {
  const { state, summary, now, today, selected } = p
  const day = fromKey(selected)
  const isToday = selected === toKey(today)
  const active = state.habits.filter((h) => !isArchived(h))
  const quitHabits = active.filter(isQuit)
  const buildHabits = active.filter((h) => !isQuit(h))
  const paused = pausedCheck(state.pauses)
  const dayPaused = paused(selected)
  const existing = buildHabits.filter((h) => h.createdAt <= selected)
  const daily = existing.filter((h) => !isWeekly(h))
  const weekly = existing.filter(isWeekly)
  const planned = daily.filter((h) => isPlannedOn(h, day, paused))
  const free = daily.filter((h) => !isPlannedOn(h, day, paused))
  const weekKeys = Array.from({ length: 7 }, (_, i) => toKey(addDays(weekStart(day), i)))
  const weekDone = (id: string) => weekKeys.filter((k) => state.done[id]?.[k]).length
  const doneCount = planned.filter((h) => state.done[h.id]?.[selected]).length
  const ratio = planned.length ? doneCount / planned.length : 0
  const complete = planned.length > 0 && doneCount === planned.length
  const left = planned.length - doneCount

  const buildMessage = dayPaused
    ? 'Pausetag: Deine Serien laufen weiter.'
    : !planned.length
    ? 'Heute ist nichts zum Aufbauen geplant.'
    : complete
      ? isToday
        ? 'Perfekter Tag. Alles erledigt!'
        : 'An diesem Tag hast du alles geschafft.'
      : left === 1
        ? 'Nur noch eine bis zum perfekten Tag.'
        : `Noch ${left} bis zum perfekten Tag.`

  const euro = totalEuro(summary.saved)
  const minutes = summary.saved.minutes
  const kcal = summary.saved.kcal
  const savedHeadline = euro > 0 ? formatEuro(euro) : minutes > 0 ? formatMinutes(minutes) : kcal > 0 ? formatKcal(kcal) : `${summary.cleanDaysTotal} Tage`
  const savedLabel = euro > 0 || minutes > 0 || kcal > 0 ? 'Schon gespart' : 'Schon durchgezogen'
  const showRing = planned.length > 0 && quitHabits.length === 0

  return (
    <div className="view">
      <header className="top">
        <div>
          <p className="eyebrow">{formatLong(isToday ? today : day)}</p>
          <h1 className="title">{isToday ? greeting(now) : 'Rückblick'}</h1>
        </div>
      </header>

      <InstallHint onDone={p.onToast} />

      {state.habits.length === 0 ? (
        <EmptyState onAdd={p.onAdd} />
      ) : (
        <>
          <section className={`hero ${complete && showRing ? 'is-complete' : ''}`}>
            {showRing && (
              <ProgressRing value={ratio} size={132} stroke={12} tone={complete ? 'ink' : 'white'}>
                <span className="ring-big">
                  {doneCount}
                  <span className="ring-of">/{planned.length}</span>
                </span>
                <span className="ring-small">erledigt</span>
              </ProgressRing>
            )}
            <div className="hero-text">
              {quitHabits.length > 0 ? (
                <>
                  <p className="hero-label">{savedLabel}</p>
                  <p className="hero-big">{savedHeadline}</p>
                  <p className="hero-sub">
                    {euro > 0 && minutes > 0 && <>{formatMinutes(minutes)} Zeit · </>}
                    {(euro > 0 || minutes > 0) && kcal > 0 && <>{formatKcal(kcal)} · </>}
                    {summary.cleanDaysTotal} {summary.cleanDaysTotal === 1 ? 'Tag' : 'Tage'} ohne Rückfall
                  </p>
                </>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.p key={buildMessage} className="hero-msg" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                    {buildMessage}
                  </motion.p>
                </AnimatePresence>
              )}
              {!isToday && (
                <button className="link-btn" onClick={() => p.onSelect(toKey(today))}>
                  Zurück zu heute
                </button>
              )}
            </div>
          </section>

          {quitHabits.length > 0 && (
            <section aria-labelledby="quit-head" className="block">
              <div className="section-head">
                <h2 id="quit-head">Abgewöhnen</h2>
                <span className="count">{quitHabits.length}</span>
              </div>
              <div className="habit-list">
                {quitHabits.map((h) => (
                  <QuitCard
                    key={h.id}
                    habit={h}
                    stats={summary.perQuit[h.id]}
                    onRelapse={() => p.onRelapse(h.id)}
                    onOpen={() => p.onOpen(h.id)}
                  />
                ))}
              </div>
            </section>
          )}

          <CategoryStreaks categories={categoryStats(state, today)} />

          {buildHabits.length > 0 && (
            <section aria-labelledby="build-head" className="block">
              <div className="section-head">
                <h2 id="build-head">Aufbauen</h2>
                <span className="count">
                  {doneCount}/{planned.length}
                </span>
              </div>
              <WeekStrip state={state} today={today} selected={selected} onSelect={p.onSelect} />
              {dayPaused ? (
                <p className="pause-banner">
                  <b>Pausetag.</b> Heute zählt nichts gegen deine Serien. Abhaken geht trotzdem.
                </p>
              ) : (
                quitHabits.length > 0 && planned.length > 0 && <p className="build-msg">{buildMessage}</p>
              )}
              <motion.div layout className="habit-list">
                <AnimatePresence initial={false}>
                  {planned.map((h) => (
                    <HabitCard
                      key={h.id}
                      habit={h}
                      done={!!state.done[h.id]?.[selected]}
                      streak={summary.perHabit[h.id]?.current ?? 0}
                      count={state.counts[h.id]?.[selected]}
                      onToggle={() => p.onToggle(h.id, selected)}
                      onCount={(delta) => p.onCount(h.id, selected, delta)}
                      onOpen={() => p.onOpen(h.id)}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
              {weekly.length > 0 && (
                <>
                  <p className="sub-head">Diese Woche</p>
                  <div className="habit-list">
                    {weekly.map((h) => {
                      const n = weekDone(h.id)
                      const times = h.timesPerWeek ?? 1
                      return (
                        <HabitCard
                          key={h.id}
                          habit={h}
                          done={!!state.done[h.id]?.[selected]}
                          streak={summary.perHabit[h.id]?.current ?? 0}
                          streakUnit="week"
                          note={n >= times ? `Wochenziel erreicht: ${n}/${times}` : `${n} von ${times} diese Woche`}
                          count={state.counts[h.id]?.[selected]}
                          onToggle={() => p.onToggle(h.id, selected)}
                          onCount={(delta) => p.onCount(h.id, selected, delta)}
                          onOpen={() => p.onOpen(h.id)}
                        />
                      )
                    })}
                  </div>
                </>
              )}
              {free.length > 0 && (
                <>
                  <p className="sub-head">{dayPaused ? 'Pausiert' : 'Heute nicht geplant'}</p>
                  <div className="habit-list">
                    {free.map((h) => (
                      <HabitCard
                        key={h.id}
                        habit={h}
                        off
                        done={!!state.done[h.id]?.[selected]}
                        streak={summary.perHabit[h.id]?.current ?? 0}
                        count={state.counts[h.id]?.[selected]}
                        onToggle={() => p.onToggle(h.id, selected)}
                        onCount={(delta) => p.onCount(h.id, selected, delta)}
                        onOpen={() => p.onOpen(h.id)}
                      />
                    ))}
                  </div>
                </>
              )}
            </section>
          )}
        </>
      )}
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="empty">
      <div className="empty-art" aria-hidden>
        <ProgressRing value={0.72} size={150} stroke={14}>
          <span className="empty-emoji">🌱</span>
        </ProgressRing>
      </div>
      <h2>Was willst du loswerden?</h2>
      <p>Leg eine Gewohnheit an, die du dir abgewöhnen willst. Die Uhr läuft ab sofort von allein, du trägst nur Rückfälle ein.</p>
      <button className="btn btn-primary" onClick={onAdd}>
        <IconPlus size={20} /> Erste Gewohnheit anlegen
      </button>
    </div>
  )
}
