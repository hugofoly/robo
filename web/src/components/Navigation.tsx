import type { ReactNode } from 'react'
import type { Section } from '../lib/store'
import { BubblesIcon, HeartIcon, PhotoIcon, SparklesIcon, WandIcon } from './Icons'

export type { Section }

// Rótulo curto na tela (cabe nas 5 abas em qualquer largura); o nome completo é o rótulo acessível.
const ITEMS: { id: Section; label: string; short: string; icon: ReactNode }[] = [
  { id: 'assistant', label: 'Assistente', short: 'Assistente', icon: <SparklesIcon /> },
  { id: 'modes', label: 'Modos especiais', short: 'Modos', icon: <WandIcon /> },
  { id: 'photos', label: 'Fotos de Impacto', short: 'Fotos', icon: <PhotoIcon /> },
  { id: 'match', label: 'Robô de Match', short: 'Match', icon: <HeartIcon /> },
  { id: 'conversations', label: 'Minhas conversas', short: 'Conversas', icon: <BubblesIcon /> },
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
              aria-label={item.label}
              aria-current={current === item.id ? 'page' : undefined}
              onClick={() => onChange(item.id)}
            >
              {item.icon}
              <span className="nav-label-short" aria-hidden="true">
                {item.short}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
