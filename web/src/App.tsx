import { useCallback, useEffect, useRef, useState } from 'react'
import { Assistant } from './components/Assistant'
import { Header } from './components/Header'
import { LegalLinks, LegalSheet } from './components/LegalSheet'
import { MyConversations } from './components/MyConversations'
import { Onboarding } from './components/Onboarding'
import { Navigation } from './components/Navigation'
import { PhotoGallery } from './components/PhotoGallery'
import { MatchSection, SpecialModes } from './components/SpecialModes'
import { Toast } from './components/Toast'
import { StoreProvider, useActions, useAppState } from './lib/StoreProvider'

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}

function Shell() {
  // Navegação, rascunhos, resultados, conversas e preferências vivem no store em memória.
  const section = useAppState((s) => s.section)
  // Com o onboarding aberto, a página fica inerte (fora do foco e dos leitores de tela).
  const onboardingOpen = useAppState((s) => s.onboarding.stage !== 'done')
  const legalOpen = useAppState((s) => s.legalPage !== null)
  const { selectTab } = useActions()
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  const showToast = useCallback((message: string) => {
    window.clearTimeout(toastTimer.current)
    setToast(message)
    toastTimer.current = window.setTimeout(() => setToast(null), 3500)
  }, [])

  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  // Ao fechar o onboarding, o foco vai para a primeira aba (em vez de se perder no documento).
  const wasOpen = useRef(onboardingOpen)
  useEffect(() => {
    if (wasOpen.current && !onboardingOpen) {
      document.querySelector<HTMLElement>('.app-nav .nav-item')?.focus()
    }
    wasOpen.current = onboardingOpen
  }, [onboardingOpen])

  // Trocar de seção (inclusive ao abrir uma conversa salva) começa do topo.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [section])

  return (
    <>
      <div className="app" inert={onboardingOpen || legalOpen}>
        <Header />
        <Navigation current={section} onChange={selectTab} />

        <main className="app-main">
          {section === 'assistant' && <Assistant onToast={showToast} />}
          {section === 'modes' && <SpecialModes onToast={showToast} />}
          {section === 'photos' && <PhotoGallery onToast={showToast} />}
          {section === 'match' && <MatchSection onToast={showToast} />}
          {section === 'conversations' && <MyConversations onToast={showToast} />}
        </main>

        <footer className="app-footer">
          <LegalLinks />
        </footer>

        <Toast message={toast} />
      </div>
      <div className="onboarding-layer" inert={legalOpen}>
        <Onboarding />
      </div>
      <LegalSheet />
    </>
  )
}
