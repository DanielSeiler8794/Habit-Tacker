import { useEffect, useState, type ReactNode } from 'react'

interface Props {
  className: string
  confirmLabel: string
  onConfirm: () => void
  children: ReactNode
}

/** First tap arms the button, second tap within 4 seconds runs the action. Works without window.confirm. */
export function ConfirmButton({ className, confirmLabel, onConfirm, children }: Props) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const id = setTimeout(() => setArmed(false), 4000)
    return () => clearTimeout(id)
  }, [armed])
  return (
    <button
      className={`${className} ${armed ? 'is-armed' : ''}`}
      onClick={() => {
        if (armed) {
          setArmed(false)
          onConfirm()
        } else setArmed(true)
      }}
    >
      {armed ? confirmLabel : children}
    </button>
  )
}
