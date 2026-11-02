import { milestonesFor } from '../lib/milestones'
import type { Habit } from '../lib/types'

/** The habit's milestones: reached ones ticked, the next one highlighted with its explanation. */
export function Milestones({ habit, currentDays }: { habit: Habit; currentDays: number }) {
  const stones = milestonesFor(habit)
  const nextIndex = stones.findIndex((m) => m.days > currentDays)
  return (
    <section className="card">
      <div className="card-head">
        <h3>Etappen</h3>
        <span className="muted small">seit dem letzten Rückfall</span>
      </div>
      <ol className="stones">
        {stones.map((m, i) => {
          const state = m.days <= currentDays ? 'done' : i === nextIndex ? 'next' : 'later'
          return (
            <li key={m.days} className={`stone is-${state}`}>
              <span className="stone-dot" aria-hidden>
                {state === 'done' ? '✓' : ''}
              </span>
              <span className="stone-body">
                <span className="stone-title">
                  <b>{m.title}</b>
                  <span className="muted small">
                    {m.days} {m.days === 1 ? 'Tag' : 'Tage'}
                    {state === 'next' && ` · noch ${m.days - currentDays}`}
                  </span>
                </span>
                {m.text && (state !== 'later' || i === nextIndex + 1) && <span className="stone-text">{m.text}</span>}
              </span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
