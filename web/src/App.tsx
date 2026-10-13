import { useCallback, useEffect, useRef, useState } from 'react'
import { Assistant } from './components/Assistant'
import { EmptyState } from './components/EmptyState'
import { Header } from './components/Header'
import { BubblesIcon } from './components/Icons'
import { Navigation, type Section } from './components/Navigation'
import { SpecialModes } from './components/SpecialModes'
import { Toast } from './components/Toast'
import { INITIAL_DRAFT, type AssistantDraft } from './lib/assistant'
import { emptyModeDraft, type ModeDraft, type ModeId } from './lib/modes'

export default function App() {
  const [section, setSection] = useState<Section>('assistant')
  // O rascunho vive aqui para sobreviver à troca de abas e de seções.
  const [draft, setDraft] = useState<AssistantDraft>(INITIAL_DRAFT)
  const [openMode, setOpenMode] = useState<ModeId | null>(null)
  const [modeDrafts, setModeDrafts] = useState<Record<ModeId, ModeDraft>>(() => ({
    'quick-date': emptyModeDraft(),
    'post-date': emptyModeDraft(),
    nudes: emptyModeDraft(),
    express: emptyModeDraft(),
  }))
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  const showToast = useCallback((message: string) => {
    window.clearTimeout(toastTimer.current)
    setToast(message)
    toastTimer.current = window.setTimeout(() => setToast(null), 3500)
  }, [])

  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  return (
    <div className="app">
      <Header />
      <Navigation
        current={section}
        onChange={(next) => {
          // Como numa tab bar do iOS: tocar de novo na seção atual volta ao início dela.
          if (next === 'modes' && section === 'modes') setOpenMode(null)
          setSection(next)
        }}
      />

      <main className="app-main">
        {section === 'assistant' && (
          <Assistant
            draft={draft}
            onChange={setDraft}
            onToast={showToast}
          />
        )}

        {section === 'modes' && (
          <SpecialModes
            openMode={openMode}
            onOpen={setOpenMode}
            drafts={modeDrafts}
            onDraftChange={(mode, update) => setModeDrafts((all) => ({ ...all, [mode]: update(all[mode]) }))}
            onToast={showToast}
          />
        )}

        {section === 'conversations' && (
          <EmptyState icon={<BubblesIcon size={34} />} title="Nenhuma conversa ainda">
            <p>
              Quando a análise real estiver ativa, suas conversas aparecem aqui para você retomar de onde parou.
            </p>
            <p className="muted">
              As demonstrações não ficam salvas. Nada é guardado nesta versão: prints e textos ficam apenas no seu
              navegador.
            </p>
            <button type="button" className="btn-secondary" onClick={() => setSection('assistant')}>
              Ir para o Assistente
            </button>
          </EmptyState>
        )}
      </main>

      <Toast message={toast} />
    </div>
  )
}
