import type { ReactNode } from 'react'
import { tabOf, type Section, type Tab } from '../lib/store'
import { CameraIcon, HeartIcon, SparklesIcon } from './Icons'

export type { Section }

// Três abas principais. Modos especiais vivem dentro do Assistente; Minhas conversas fica no cabeçalho.
const TABS: { id: Tab; label: string; short: string; icon: ReactNode }[] = [
  { id: 'assistant', label: 'Assistente', short: 'Assistente', icon: <SparklesIcon size={20} /> },
  { id: 'match', label: 'Robô de Match', short: 'Match', icon: <HeartIcon size={20} /> },
  { id: 'photos', label: 'Fotos de Impacto', short: 'Fotos', icon: <CameraIcon size={20} /> },
]

export function Navigation({ current, onChange }: { current: Section; onChange: (tab: Tab) => void }) {
  const active = tabOf(current)
  return (
    <nav className="app-nav" aria-label="Seções">
      <ul>
        {TABS.map((tab) => (
          <li key={tab.id}>
            <button
              type="button"
              className="nav-item"
              aria-label={tab.label}
              aria-current={active === tab.id ? 'page' : undefined}
              onClick={() => onChange(tab.id)}
            >
              {tab.icon}
              <span className="nav-label-full" aria-hidden="true">
                {tab.label}
              </span>
              <span className="nav-label-short" aria-hidden="true">
                {tab.short}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
