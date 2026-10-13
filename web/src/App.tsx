import { useCallback, useEffect, useRef, useState } from 'react'
import { Assistant } from './components/Assistant'
import { Header } from './components/Header'
import { MyConversations } from './components/MyConversations'
import { Navigation } from './components/Navigation'
import { SpecialModes } from './components/SpecialModes'
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
  const { setSection } = useActions()
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  const showToast = useCallback((message: string) => {
    window.clearTimeout(toastTimer.current)
    setToast(message)
    toastTimer.current = window.setTimeout(() => setToast(null), 3500)
  }, [])

  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  // Trocar de seção (inclusive ao abrir uma conversa salva) começa do topo.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [section])

  return (
    <div className="app">
      <Header />
      <Navigation current={section} onChange={setSection} />

      <main className="app-main">
        {section === 'assistant' && <Assistant onToast={showToast} />}
        {section === 'modes' && <SpecialModes onToast={showToast} />}
        {section === 'conversations' && <MyConversations onToast={showToast} />}
      </main>

      <Toast message={toast} />
    </div>
  )
}
