import { AnimatePresence, motion } from 'framer-motion'

export interface CelebrationData {
  key: string
  emoji: string
  kicker: string
  title: string
  text: string
}

export function Celebration({ data, onClose }: { data: CelebrationData | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {data && (
        <motion.div key={data.key} className="celebrate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            className="celebrate-card"
            role="alertdialog"
            aria-label={data.title}
            initial={{ scale: 0.92, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0, transition: { duration: 0.18, ease: 'easeOut' } }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.25 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="celebrate-art">
              <motion.span className="rays" animate={{ rotate: 360 }} transition={{ duration: 14, repeat: Infinity, ease: 'linear' }} />
              <motion.span
                className="celebrate-emoji"
                initial={{ scale: 0.6, rotate: -20, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: 'spring', duration: 0.6, bounce: 0.35, delay: 0.12 }}
              >
                {data.emoji}
              </motion.span>
            </div>
            <p className="celebrate-kicker">{data.kicker}</p>
            <h2>{data.title}</h2>
            <p className="celebrate-text">{data.text}</p>
            <button className="btn btn-primary" onClick={onClose} autoFocus>
              Weiter so
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
