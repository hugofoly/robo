import { useEffect, useRef, useState, type FormEvent } from 'react'
import { TONES, cardText } from '../lib/demo'
import { useActions, useAppState, useStoreSnapshot } from '../lib/StoreProvider'
import { searchConversations, workspaceHasUnsavedWork, type SavedConversation, type Section } from '../lib/store'
import { EmptyState } from './EmptyState'
import { BackIcon, BubblesIcon } from './Icons'
import { PreferencesCard } from './Preferences'
import { TEMP_HISTORY_NOTICE } from './Results'

const BACK_LABEL: Record<Section, string> = {
  assistant: 'Assistente',
  modes: 'Modos especiais',
  match: 'Robô de Match',
  photos: 'Fotos de Impacto',
  conversations: 'Voltar',
}

const dateFmt = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })

export function MyConversations({ onToast }: { onToast: (message: string) => void }) {
  const conversations = useAppState((s) => s.conversations)
  const returnTo = useAppState((s) => s.returnTo)
  const { goBack } = useActions()
  const [query, setQuery] = useState('')
  const visible = searchConversations(conversations, query)

  return (
    <section className="conversations" aria-labelledby="conversations-title">
      <button type="button" className="btn-back" onClick={goBack}>
        <BackIcon /> {BACK_LABEL[returnTo]}
      </button>
      <div className="modes-head">
        <h2 id="conversations-title">Minhas conversas</h2>
      </div>
      <p className="temp-banner" role="note">
        {TEMP_HISTORY_NOTICE}
      </p>

      {conversations.length === 0 ? (
        <EmptyStateNoConversations />
      ) : (
        <>
          <div className="search">
            <label htmlFor="conversation-search" className="visually-hidden">
              Buscar pelo nome
            </label>
            <input
              id="conversation-search"
              type="search"
              className="text-input"
              placeholder="Buscar pelo nome"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {visible.length === 0 ? (
            <p className="search-empty">Nenhuma conversa com “{query.trim()}” no nome.</p>
          ) : (
            <ul className="conversation-list" aria-label="Conversas salvas">
              {visible.map((c) => (
                <ConversationRow key={c.id} conversation={c} onToast={onToast} />
              ))}
            </ul>
          )}
        </>
      )}

      <PreferencesCard />
      <ReviewTour />
    </section>
  )
}

function EmptyStateNoConversations() {
  const { setSection } = useActions()
  return (
    <EmptyState icon={<BubblesIcon size={34} />} title="Nenhuma conversa salva">
      <p>Gere sugestões no Assistente ou num modo especial e toque em “Salvar conversa” para guardar aqui.</p>
      <p className="muted">Gerar sem salvar não cria histórico. Prints e áudios nunca são guardados.</p>
      <button type="button" className="btn-secondary" onClick={() => setSection('assistant')}>
        Ir para o Assistente
      </button>
    </EmptyState>
  )
}

function ConversationRow({ conversation: c, onToast }: { conversation: SavedConversation; onToast: (m: string) => void }) {
  const { openConversation, renameConversation, deleteConversation } = useActions()
  const getState = useStoreSnapshot()
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(c.name)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (renaming) inputRef.current?.select()
  }, [renaming])

  const recommended = c.result.request.content.recommended
  const preview = cardText(c.result.request.content.cards[recommended], c.result.versions[recommended])
  const toneLabel = TONES.find((t) => t.id === recommended)?.label
  const meta = [c.modeLabel, c.goalLabel].filter(Boolean).join(' · ')
  const followUps = c.result.thread.length

  function open() {
    if (
      workspaceHasUnsavedWork(getState(), c.workspace, c.id) &&
      !window.confirm('Abrir esta conversa substitui o que está em andamento nessa área. Continuar?')
    ) {
      return
    }
    openConversation(c.id)
  }

  function submitRename(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    renameConversation(c.id, name)
    setRenaming(false)
    onToast('Conversa renomeada.')
  }

  function remove() {
    if (!window.confirm(`Excluir “${c.name}”? Essa ação não pode ser desfeita.`)) return
    deleteConversation(c.id)
    onToast('Conversa excluída.')
  }

  return (
    <li className="conversation card">
      {renaming ? (
        <form className="rename-form" onSubmit={submitRename}>
          <label htmlFor={`rename-${c.id}`} className="visually-hidden">
            Novo nome
          </label>
          <input
            ref={inputRef}
            id={`rename-${c.id}`}
            className="text-input"
            type="text"
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="preview-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setName(c.name)
                setRenaming(false)
              }}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-save" disabled={!name.trim()}>
              Salvar nome
            </button>
          </div>
        </form>
      ) : (
        <h3 className="conversation-name">{c.name}</h3>
      )}
      <p className="conversation-meta">
        {meta} · {c.updatedAt > c.createdAt ? 'atualizada' : 'salva'} às {dateFmt.format(c.updatedAt)}
      </p>
      {c.context && <p className="conversation-context">{c.context}</p>}
      <p className="conversation-preview">
        <span className="tag">{toneLabel}</span> {preview}
      </p>
      {followUps > 0 && (
        <p className="conversation-meta">
          {followUps} {followUps === 1 ? 'item' : 'itens'} de acompanhamento
        </p>
      )}
      <div className="conversation-actions">
        <button type="button" className="btn-save" onClick={open}>
          Abrir e continuar
        </button>
        {!renaming && (
          <button type="button" className="btn-pill" onClick={() => setRenaming(true)}>
            Renomear
          </button>
        )}
        <button type="button" className="btn-pill destructive" onClick={remove}>
          Excluir
        </button>
      </div>
    </li>
  )
}

function ReviewTour() {
  const { reopenOnboarding } = useActions()
  return (
    <button type="button" className="entry-row review-tour" onClick={reopenOnboarding}>
      <span className="entry-text">
        <span className="entry-title">Rever apresentação</span>
        <span className="entry-sub">Boas-vindas e tour pelas abas do app.</span>
      </span>
    </button>
  )
}
