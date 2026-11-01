import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { useInstall } from '../lib/install'
import { IconX } from './icons'
import { InstallButton } from './InstallButton'

const KEY = 'habits:installHintDismissed'

const dismissedBefore = () => {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

/** Offers installing once on phones; closing it hides it for good (the button stays under „Mehr“). */
export function InstallHint({ onDone }: { onDone: (message: string) => void }) {
  const { mode } = useInstall()
  const [hidden, setHidden] = useState(dismissedBefore)
  const phone = matchMedia('(pointer: coarse)').matches
  const show = phone && !hidden && (mode === 'native' || mode === 'ios-safari' || mode === 'ios-other')

  const dismiss = () => {
    setHidden(true)
    try {
      localStorage.setItem(KEY, '1')
    } catch {
      // ignore
    }
  }

  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.section
          className="install-hint"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] } }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
        >
          <div className="install-hint-text">
            <b>Habits als App nutzen</b>
            <span>Mit eigenem Icon, im Vollbild und auch offline.</span>
          </div>
          <InstallButton className="btn btn-primary btn-sm" label="Hinzufügen" onDone={onDone} />
          <button className="install-hint-close" onClick={dismiss} aria-label="Hinweis schliessen">
            <IconX size={18} />
          </button>
        </motion.section>
      )}
    </AnimatePresence>
  )
}
