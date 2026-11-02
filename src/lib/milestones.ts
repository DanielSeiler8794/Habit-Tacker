import type { Habit } from './types'

export interface Milestone {
  days: number
  title: string
  /** What tends to change by then; health notes are cautious on purpose */
  text?: string
}

const GENERIC: Milestone[] = [
  { days: 1, title: 'Der erste Tag', text: 'Der schwerste Schritt ist gemacht.' },
  { days: 3, title: 'Drei Tage', text: 'Die ersten Tage sind oft die härtesten. Sie liegen hinter dir.' },
  { days: 7, title: 'Eine Woche', text: 'Eine ganze Woche ohne. Das alte Muster verliert an Kraft.' },
  { days: 14, title: 'Zwei Wochen' },
  { days: 30, title: 'Ein Monat', text: 'Aus Verzicht wird langsam Normalität.' },
  { days: 60, title: 'Zwei Monate' },
  { days: 90, title: 'Drei Monate', text: 'Nach etwa drei Monaten fühlt sich eine neue Routine für viele selbstverständlich an.' },
  { days: 180, title: 'Ein halbes Jahr' },
  { days: 365, title: 'Ein Jahr', text: 'Ein ganzes Jahr. Stark.' },
]

/** Day milestones with a meaning per template; the wording stays careful, these are typical effects, not promises. */
const BY_TEMPLATE: Record<string, Milestone[]> = {
  smoking: [
    { days: 1, title: 'Kohlenmonoxid sinkt', text: 'Laut WHO sinkt das Kohlenmonoxid im Blut schon nach etwa 12 Stunden auf Normalwert.' },
    { days: 2, title: 'Geschmack und Geruch', text: 'Viele schmecken und riechen nach zwei Tagen spürbar besser.' },
    { days: 3, title: 'Freier atmen', text: 'Die Bronchien entspannen sich, das Atmen fällt oft leichter. Das Verlangen ist jetzt meist am stärksten.' },
    { days: 14, title: 'Kreislauf erholt sich', text: 'Laut WHO verbessern sich Durchblutung und Lungenfunktion nach 2 bis 12 Wochen.' },
    { days: 30, title: 'Weniger Husten', text: 'Laut WHO nehmen Husten und Kurzatmigkeit nach 1 bis 9 Monaten ab.' },
    { days: 90, title: 'Mehr Puste', text: 'Treppen und Sport gehen bei vielen merklich leichter.' },
    { days: 180, title: 'Ein halbes Jahr rauchfrei' },
    { days: 365, title: 'Herz-Risiko halbiert', text: 'Laut WHO ist das Risiko für koronare Herzkrankheit nach einem Jahr etwa halb so hoch wie bei Rauchenden.' },
  ],
  alcohol: [
    { days: 1, title: 'Der erste Tag', text: 'Der Körper beginnt, sich vom Alkohol zu erholen.' },
    { days: 3, title: 'Besserer Schlaf', text: 'Viele schlafen nach ein paar Tagen ruhiger und erholsamer.' },
    { days: 7, title: 'Mehr Energie', text: 'Nach einer Woche berichten viele von mehr Energie und klarerem Kopf.' },
    { days: 14, title: 'Haut und Magen', text: 'Haut und Magen profitieren oft schon nach zwei Wochen.' },
    { days: 30, title: 'Ein Monat ohne', text: 'Die Leber kann sich in dieser Zeit spürbar erholen, auch Blutdruck und Gewicht reagieren oft.' },
    { days: 90, title: 'Drei Monate', text: 'Aus der Ausnahme ist eine neue Gewohnheit geworden.' },
    { days: 180, title: 'Ein halbes Jahr' },
    { days: 365, title: 'Ein Jahr ohne Alkohol' },
  ],
  sugar: [
    { days: 1, title: 'Der erste Tag' },
    { days: 3, title: 'Heisshunger lässt nach', text: 'Das Verlangen nach Süssem wird bei vielen nach ein paar Tagen schwächer.' },
    { days: 7, title: 'Stabilere Energie', text: 'Weniger Zuckerspitzen bedeuten oft weniger Leistungstiefs am Nachmittag.' },
    { days: 14, title: 'Feinerer Geschmack', text: 'Obst und Natürliches schmecken plötzlich süsser.' },
    { days: 30, title: 'Ein Monat', text: 'Süsses ist jetzt eine Entscheidung, keine Gewohnheit mehr.' },
    { days: 90, title: 'Drei Monate' },
    { days: 365, title: 'Ein Jahr' },
  ],
  screen: [
    { days: 1, title: 'Der erste Tag', text: 'Achte darauf, wie oft du reflexartig zum Handy greifst.' },
    { days: 3, title: 'Mehr Ruhe', text: 'Der Drang, ständig nachzuschauen, wird bei vielen leiser.' },
    { days: 7, title: 'Eine Woche', text: 'Zeit, die du sonst verscrollt hättest, gehört jetzt dir.' },
    { days: 14, title: 'Bessere Konzentration', text: 'Viele können sich nach zwei Wochen länger am Stück konzentrieren.' },
    { days: 30, title: 'Ein Monat' },
    { days: 90, title: 'Drei Monate' },
    { days: 365, title: 'Ein Jahr' },
  ],
}

export const milestonesFor = (h: Habit) => BY_TEMPLATE[h.template ?? ''] ?? GENERIC
