import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

type Tone = 'blue' | 'orange' | 'white' | 'ink'

const STROKE: Record<Tone, string> = { blue: '#105bff', orange: '#fe8500', white: '#ffffff', ink: '#21232e' }
const TRACK: Record<Tone, string> = { blue: 'var(--track)', orange: 'var(--track)', white: 'rgba(255,255,255,.24)', ink: 'rgba(33,35,46,.18)' }

interface Props {
  value: number
  size?: number
  stroke?: number
  tone?: Tone
  children?: ReactNode
}

export function ProgressRing({ value, size = 140, stroke = 14, tone = 'blue', children }: Props) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(1, value))
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={TRACK[tone]} strokeWidth={stroke} style={{ transition: 'stroke .5s' }} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={STROKE[tone]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - v) }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke .5s' }}
        />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  )
}
