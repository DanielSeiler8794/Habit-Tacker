import { addDays, toKey, WEEKDAY_SHORT } from './dates'
import { isScheduled } from './stats'
import type { AppState, Habit } from './types'

export const notificationsSupported = () => typeof window !== 'undefined' && 'Notification' in window

export async function requestNotifications(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return 'denied'
  if (Notification.permission === 'default') return Notification.requestPermission()
  return Notification.permission
}

const SENT_KEY = 'habits:notified'

async function notify(title: string, body: string) {
  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) return reg.showNotification(title, { body, icon: './icon-192.png', badge: './icon-192.png' })
  } catch {
    // fall back below
  }
  new Notification(title, { body, icon: './icon-192.png' })
}

/**
 * Fires reminders while the app is open or running in the background.
 * Reminders within the last 30 minutes still go out, each habit at most once a day.
 */
export function startReminderLoop(getState: () => AppState) {
  const tick = () => {
    if (!notificationsSupported() || Notification.permission !== 'granted') return
    const now = new Date()
    const k = toKey(now)
    const minutes = now.getHours() * 60 + now.getMinutes()
    let sent: Record<string, string> = {}
    try {
      sent = JSON.parse(localStorage.getItem(SENT_KEY) ?? '{}')
    } catch {
      sent = {}
    }
    const state = getState()
    for (const h of state.habits) {
      if (!h.reminder || sent[h.id] === k || !isScheduled(h, now) || state.done[h.id]?.[k]) continue
      const [hh, mm] = h.reminder.split(':').map(Number)
      const due = hh * 60 + mm
      if (minutes >= due && minutes - due <= 30) {
        notify(`${h.emoji} ${h.name}`, 'Zeit für deine Gewohnheit. Halte die Serie am Leben!')
        sent[h.id] = k
      }
    }
    try {
      localStorage.setItem(SENT_KEY, JSON.stringify(sent))
    } catch {
      // ignore
    }
  }
  tick()
  const id = window.setInterval(tick, 30_000)
  return () => window.clearInterval(id)
}

const ICS_DAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
const icsStamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
const icsEscape = (s: string) => s.replace(/[\;,]/g, (c) => `\\${c}`)

/** First upcoming scheduled day, the start time and the recurrence rule of a habit's reminder. */
function recurrence(h: Habit) {
  const [hh, mm] = (h.reminder ?? '09:00').split(':')
  let first = new Date()
  for (let i = 0; i < 7 && !isScheduled(h, first); i++) first = addDays(first, 1)
  const date = toKey(first).replace(/-/g, '')
  const rule = h.days.length === 7 ? 'FREQ=DAILY' : `FREQ=WEEKLY;BYDAY=${h.days.map((d) => ICS_DAY[d]).join(',')}`
  return { hh, mm, date, rule }
}

/** Builds a recurring calendar event so the phone's calendar can remind reliably. */
export function buildIcs(h: Habit) {
  const { hh, mm, date, rule } = recurrence(h)
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Habits//DE',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${h.id}-${Date.now()}@habits.local`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${date}T${hh}${mm}00`,
    'DURATION:PT15M',
    `RRULE:${rule}`,
    `SUMMARY:${icsEscape(`${h.emoji} ${h.name}`)}`,
    'DESCRIPTION:Zeit für deine Gewohnheit. Abhaken nicht vergessen!',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsEscape(h.name)}`,
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

/** Opens Google Calendar with the recurring reminder filled in; works wherever links work. */
export function googleCalendarUrl(h: Habit) {
  const { hh, mm, date, rule } = recurrence(h)
  const endMin = Number(hh) * 60 + Number(mm) + 15
  const end = `${String(Math.floor(endMin / 60) % 24).padStart(2, '0')}${String(endMin % 60).padStart(2, '0')}00`
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${h.emoji} ${h.name}`,
    details: 'Zeit für deine Gewohnheit. Abhaken nicht vergessen!',
    dates: `${date}T${hh}${mm}00/${date}T${end}`,
    recur: `RRULE:${rule}`,
    ctz: Intl.DateTimeFormat().resolvedOptions().timeZone,
  })
  return `https://calendar.google.com/calendar/render?${params}`
}

interface Downloads {
  save(r: { filename: string; data: string }): Promise<unknown>
}
type ClaudeHost = { use?: (name: string) => Promise<unknown> }
const host = () => (window as unknown as { claude?: ClaudeHost }).claude

/** True when the app runs as a claude.ai artifact, where plain downloads are blocked. */
export const inArtifact = () => typeof host()?.use === 'function'

let downloads: Promise<Downloads | null> | null = null

/**
 * Saves a file: through the artifact's downloads capability (the viewer confirms),
 * or as a normal browser download when the app runs on its own.
 */
export async function saveFile(name: string, content: string, type: string): Promise<'saved' | 'declined' | 'unavailable'> {
  if (!inArtifact()) {
    downloadFile(name, content, type)
    return 'saved'
  }
  downloads ??= (host()!.use!('downloads') as Promise<Downloads | null>).catch(() => null)
  const d = await downloads
  if (!d) return 'unavailable'
  try {
    await d.save({ filename: name, data: content })
    return 'saved'
  } catch (e) {
    return (e as { code?: string })?.code === 'declined' ? 'declined' : 'unavailable'
  }
}

export function downloadFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const reminderLabel = (h: Habit) =>
  h.reminder ? `${h.reminder} Uhr${h.days.length < 7 ? ` · ${h.days.map((d) => WEEKDAY_SHORT[d]).join(' ')}` : ''}` : null
