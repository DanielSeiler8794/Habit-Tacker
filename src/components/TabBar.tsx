import { motion } from 'framer-motion'
import { IconGear, IconHome, IconPlus, IconTrophy } from './icons'

export type Tab = 'today' | 'profile' | 'settings'

const TABS: { id: Tab; label: string; Icon: typeof IconHome }[] = [
  { id: 'today', label: 'Heute', Icon: IconHome },
  { id: 'profile', label: 'Erfolge', Icon: IconTrophy },
  { id: 'settings', label: 'Mehr', Icon: IconGear },
]

export function TabBar({ tab, onTab, onAdd }: { tab: Tab; onTab: (t: Tab) => void; onAdd: () => void }) {
  return (
    <nav className="dock" aria-label="Navigation">
      <div className="tabbar">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} className={`tab ${tab === id ? 'is-active' : ''}`} onClick={() => onTab(id)} aria-current={tab === id ? 'page' : undefined}>
            {tab === id && <motion.span layoutId="tab-pill" className="tab-pill" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </div>
      <motion.button className="fab" onClick={onAdd} whileTap={{ scale: 0.92 }} aria-label="Neue Gewohnheit">
        <IconPlus size={26} />
      </motion.button>
    </nav>
  )
}
