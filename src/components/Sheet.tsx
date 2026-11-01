import { AnimatePresence, motion, useDragControls } from 'framer-motion'
import { useEffect, type ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  label: string
  children: ReactNode
  tall?: boolean
}

export function Sheet({ open, onClose, label, children, tall }: Props) {
  const controls = useDragControls()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="sheet-layer" key="layer">
          <motion.div
            className="backdrop"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] } }}
            exit={{ opacity: 0, transition: { duration: 0.25, ease: 'easeOut' } }}
          />
          <motion.div
            className={`sheet ${tall ? 'sheet-tall' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            initial={{ y: '100%' }}
            animate={{ y: 0, transition: { duration: 0.45, ease: [0.32, 0.72, 0, 1] } }}
            exit={{ y: '100%', transition: { duration: 0.28, ease: [0.32, 0.72, 0, 1] } }}
            drag="y"
            dragListener={false}
            dragControls={controls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            onDragEnd={(_, info) => {
              // A quick flick is enough; no need to drag past a threshold.
              if (info.offset.y > 110 || info.velocity.y > 500) onClose()
            }}
          >
            <div className="sheet-grip" onPointerDown={(e) => controls.start(e)}>
              <span />
            </div>
            <div className="sheet-body">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
