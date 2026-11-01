import type { CategoryStats } from '../lib/categories'
import { IconFlame } from './icons'

export function CategoryStreaks({ categories }: { categories: CategoryStats[] }) {
  if (!categories.length) return null
  return (
    <section aria-labelledby="cat-head">
      <div className="section-head">
        <h2 id="cat-head">Serien nach Kategorie</h2>
      </div>
      <div className="cat-scroll">
        {categories.map((c) => {
          const todayDone = c.plannedToday > 0 && c.doneToday === c.plannedToday
          return (
            <div key={c.id} className={`cat ${c.streak >= 7 ? 'is-hot' : ''}`}>
              <span className="cat-label">{c.label}</span>
              <span className="cat-streak">
                <IconFlame size={18} />
                {c.streak}
                <span className="cat-unit">{c.streak === 1 ? 'Tag' : 'Tage'}</span>
              </span>
              <span className="cat-today">
                {c.plannedToday === 0 ? 'Heute frei' : todayDone ? 'Heute geschafft' : `Heute ${c.doneToday} von ${c.plannedToday}`}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
