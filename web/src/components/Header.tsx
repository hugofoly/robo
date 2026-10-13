import { useActions, useAppState } from '../lib/StoreProvider'
import { BubblesIcon } from './Icons'
import { AppIcon } from './Logo'

export function Header() {
  const section = useAppState((s) => s.section)
  const saved = useAppState((s) => s.conversations.length)
  const { setSection } = useActions()

  return (
    <header className="app-header">
      <div className="brand">
        <AppIcon size={40} />
        <div className="brand-text">
          <div className="brand-title">
            <h1 className="brand-name">
              Robô de <span className="accent">Date</span>
            </h1>
          </div>
          <p className="tagline">A mensagem certa muda o jogo</p>
        </div>
      </div>
      <button
        type="button"
        className="header-action"
        aria-label={saved ? `Minhas conversas (${saved} salvas)` : 'Minhas conversas'}
        aria-current={section === 'conversations' ? 'page' : undefined}
        title="Minhas conversas"
        onClick={() => setSection('conversations')}
      >
        <BubblesIcon size={22} />
        {saved > 0 && (
          <span className="header-count" aria-hidden="true">
            {saved}
          </span>
        )}
      </button>
    </header>
  )
}
