import type { ReactNode } from 'react'
import { BubblesIcon, SparklesIcon, WandIcon } from './Icons'

export type Section = 'assistant' | 'modes' | 'conversations'

const ITEMS: { id: Section; label: string; icon: ReactNode }[] = [
  { id: 'assistant', label: 'Assistente', icon: <SparklesIcon /> },
  { id: 'modes', label: 'Modos especiais', icon: <WandIcon /> },
  { id: 'conversations', label: 'Minhas conversas', icon: <BubblesIcon /> },
]

export function Navigation({ current, onChange }: { current: Section; onChange: (s: Section) => void }) {
  return (
    <nav className="app-nav" aria-label="Seções">
      <ul>
        {ITEMS.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className="nav-item"
              aria-current={current === item.id ? 'page' : undefined}
              onClick={() => onChange(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
