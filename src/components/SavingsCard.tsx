import { formatEuro, formatMinutes, totalEuro, type Savings } from '../lib/quit'
import type { Habit } from '../lib/types'

const hours = (h: number) => Math.floor(h).toLocaleString('de-DE')

interface Props {
  title: string
  saved: Savings
  /** With a habit, each figure names the rate it was computed from */
  habit?: Habit
}

export function SavingsCard({ title, saved, habit }: Props) {
  const items: { value: string; label: string }[] = []
  const euro = totalEuro(saved)
  const both = saved.money > 0 && saved.timeValue > 0

  if (saved.money > 0 || (habit && habit.costMoney))
    items.push({ value: formatEuro(saved.money), label: habit ? `Geld · ${formatEuro(habit.costMoney ?? 0)} pro Tag` : 'Geld nicht ausgegeben' })
  if (saved.minutes > 0 || (habit && habit.costMinutes))
    items.push({ value: formatMinutes(saved.minutes), label: habit ? `Zeit · ${habit.costMinutes} Min. pro Tag` : 'Zeit zurückgewonnen' })
  if (saved.timeValue > 0 || (habit && habit.hourValue))
    items.push({ value: formatEuro(saved.timeValue), label: habit ? `Zeitwert · ${habit.hourValue} € pro Stunde` : 'Wert der gesparten Zeit' })
  if (habit?.hourFactor)
    items.push({
      value: `${hours(saved.productiveHours)} Std`,
      label: `${habit.factorLabel || 'Produktives'} · 1 Std = ${habit.hourFactor} Std`,
    })

  if (!items.length) return null
  return (
    <section className="saved-card">
      <div className="saved-top">
        <h3>{title}</h3>
        {both && <span className="saved-total">{formatEuro(euro)} gesamt</span>}
      </div>
      <div className="saved-row">
        {items.map((it) => (
          <div key={it.label}>
            <span className="saved-value">{it.value}</span>
            <span className="saved-label">{it.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
