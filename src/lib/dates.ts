const pad = (n: number) => String(n).padStart(2, '0')

export const toKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const fromKey = (k: string) => {
  const [y, m, d] = k.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const addDays = (d: Date, n: number) => {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]
/** Display order Monday..Sunday */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]
export const WEEKDAY_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
export const MONTH_SHORT = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

export const formatLong = (d: Date) =>
  d.toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long' })

export function describeDays(days: number[]) {
  if (days.length === 7) return 'Täglich'
  const sorted = WEEK_ORDER.filter((d) => days.includes(d))
  if (sorted.length === 5 && !days.includes(0) && !days.includes(6)) return 'Werktags'
  if (sorted.length === 2 && days.includes(0) && days.includes(6)) return 'Am Wochenende'
  return sorted.map((d) => WEEKDAY_SHORT[d]).join(', ')
}

export function greeting(d: Date) {
  const h = d.getHours()
  if (h < 5) return 'Gute Nacht'
  if (h < 11) return 'Guten Morgen'
  if (h < 17) return 'Hallo'
  if (h < 22) return 'Guten Abend'
  return 'Gute Nacht'
}
