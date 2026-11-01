import { useEffect, useState } from 'react'
import { inArtifact } from './reminders'

/**
 * How this device can put the app on its home screen:
 * - installed: already running from the home screen
 * - native: the browser offers its own install dialog (Android Chrome, Edge, Samsung Internet)
 * - ios-safari: iPhone/iPad Safari, which only allows Share → Add to Home Screen by hand
 * - ios-other: another browser on iOS; adding to the home screen needs Safari
 * - manual: any other browser; point to its menu
 * - artifact: inside Claude, where the page itself cannot be installed
 */
export type InstallMode = 'installed' | 'native' | 'ios-safari' | 'ios-other' | 'manual' | 'artifact'

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: InstallPromptEvent | null = null
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

// The browser fires this once, early; keep it so a button can open the dialog later.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as InstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    notify()
  })
}

export function isStandalone() {
  return matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true
}

/** iPadOS reports itself as a Mac; touch support tells them apart. */
export function isIOS(ua = navigator.userAgent, touchPoints = navigator.maxTouchPoints) {
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && touchPoints > 1)
}

export function detectInstallMode(ua = navigator.userAgent, touchPoints = navigator.maxTouchPoints): InstallMode {
  if (inArtifact()) return 'artifact'
  if (isStandalone()) return 'installed'
  if (isIOS(ua, touchPoints)) return /CriOS|FxiOS|EdgiOS|OPiOS|GSA\//.test(ua) ? 'ios-other' : 'ios-safari'
  if (deferred) return 'native'
  return 'manual'
}

export function useInstall() {
  const [mode, setMode] = useState<InstallMode>(() => detectInstallMode())
  useEffect(() => {
    const update = () => setMode(detectInstallMode())
    listeners.add(update)
    const mq = matchMedia('(display-mode: standalone)')
    mq.addEventListener('change', update)
    return () => {
      listeners.delete(update)
      mq.removeEventListener('change', update)
    }
  }, [])

  /** Opens the browser's own install dialog; resolves true when the user accepts. */
  const install = async () => {
    if (!deferred) return false
    const e = deferred
    deferred = null
    await e.prompt()
    const { outcome } = await e.userChoice
    notify()
    return outcome === 'accepted'
  }

  return { mode, install }
}
