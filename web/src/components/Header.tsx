import { AppIcon } from './Logo'

export function Header() {
  return (
    <header className="app-header">
      <div className="brand">
        <AppIcon />
        <div className="brand-text">
          <div className="brand-title">
            <h1 className="brand-name">
              Robô de <span className="accent">Date</span>
            </h1>
            <span className="badge">Beta</span>
          </div>
          <p className="tagline">A mensagem certa muda o jogo</p>
        </div>
      </div>
    </header>
  )
}
