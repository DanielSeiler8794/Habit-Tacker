import type { Habit } from './types'

export interface Template {
  id: string
  name: string
  emoji: string
  /** Fields copied into the form; costs are typical starting values to adjust */
  fill: Partial<Habit>
}

export const QUIT_TEMPLATES: Template[] = [
  { id: 'smoking', name: 'Rauchen', emoji: '🚬', fill: { category: 'gesundheit', saves: ['money', 'time'], costMoney: 9, costMinutes: 40, template: 'smoking' } },
  { id: 'alcohol', name: 'Alkohol', emoji: '🍺', fill: { category: 'gesundheit', saves: ['money', 'kcal'], costMoney: 8, costKcal: 500, template: 'alcohol' } },
  { id: 'sweets', name: 'Süssigkeiten', emoji: '🍫', fill: { category: 'gesundheit', saves: ['money', 'kcal'], costMoney: 2, costKcal: 400, template: 'sugar' } },
  { id: 'fastfood', name: 'Fast Food', emoji: '🍔', fill: { category: 'gesundheit', saves: ['money', 'kcal'], costMoney: 10, costKcal: 900, template: 'sugar' } },
  { id: 'energy', name: 'Energy Drinks', emoji: '🥤', fill: { category: 'gesundheit', saves: ['money', 'kcal'], costMoney: 3, costKcal: 220, template: 'sugar' } },
  { id: 'social', name: 'Social-Media-Scrollen', emoji: '📱', fill: { category: 'geist', saves: ['time'], costMinutes: 90, template: 'screen' } },
  { id: 'shopping', name: 'Online-Shopping', emoji: '🛒', fill: { category: 'alltag', saves: ['money'], costMoney: 15 } },
]

export const BUILD_TEMPLATES: Template[] = [
  { id: 'water', name: 'Wasser trinken', emoji: '💧', fill: { category: 'gesundheit', frequency: 'days', target: 8, unit: 'Gläser' } },
  { id: 'sport', name: 'Sport', emoji: '💪', fill: { category: 'bewegung', frequency: 'weekly', timesPerWeek: 3 } },
  { id: 'read', name: 'Lesen', emoji: '📚', fill: { category: 'lernen', frequency: 'days' } },
  { id: 'meditate', name: 'Meditieren', emoji: '🧘', fill: { category: 'geist', frequency: 'days' } },
  { id: 'walk', name: 'Spazieren gehen', emoji: '🚶', fill: { category: 'bewegung', frequency: 'days' } },
  { id: 'sleep', name: 'Vor 23 Uhr schlafen', emoji: '🛏️', fill: { category: 'gesundheit', frequency: 'days' } },
]
