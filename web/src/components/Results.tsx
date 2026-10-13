import { useEffect, useRef, useState, type FormEvent } from 'react'
import { DEMO_NOTICE, OWN_INPUT_MESSAGES, type DemoContent } from '../lib/demo'
import { DETAIL_OPTIONS, TONE_PREF_OPTIONS, explain, orderTones, type Preferences } from '../lib/preferences'
import { useActions, useAppState } from '../lib/StoreProvider'
import type { ResultState, WorkspaceId } from '../lib/store'
import type { GenerationStatus } from '../lib/useDemoGeneration'
import { FollowUp } from './FollowUp'
import { AlertIcon } from './Icons'
import { SuggestionCard } from './SuggestionCard'

export const TEMP_HISTORY_NOTICE = 'Histórico temporário: será apagado ao recarregar a página.'

interface Props {
  workspace: WorkspaceId
  status: GenerationStatus
  onRetry: () => void
  onToast: (message: string) => void
}

export function Results({ workspace, status, onRetry, onToast }: Props) {
  const result = useAppState((s) => s.workspaces[workspace].result)
  const preferences = useAppState((s) => s.preferences)
  const regionRef = useRef<HTMLElement>(null)
  const focusRef = useRef<HTMLHeadingElement>(null)
  // Ao voltar para a tela com um resultado já existente, não rola: só quando chega um resultado novo.
  const lastRun = useRef(result?.runId)

  useEffect(() => {
    if (status.status === 'loading') regionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (status.status === 'error') {
      focusRef.current?.focus({ preventScroll: true })
      regionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [status])

  useEffect(() => {
    if (result && result.runId !== lastRun.current) {
      lastRun.current = result.runId
      focusRef.current?.focus({ preventScroll: true })
      regionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [result])

  const label = status.status !== 'idle' ? status.request.label : result?.request.label
  if (!label) return null

  return (
    <section ref={regionRef} className="results" aria-labelledby="results-title" aria-busy={status.status === 'loading'}>
      <header className="results-head">
        <h2 id="results-title" ref={focusRef} tabIndex={-1}>
          Sugestões
        </h2>
        <span className="badge badge-demo">Demonstração</span>
      </header>
      <p className="results-meta">{label}</p>
      <p className="demo-notice">{DEMO_NOTICE}</p>

      {status.status === 'loading' && <Loading />}

      {status.status === 'error' && (
        <div className="card error-card" role="alert">
          <div className="error-title">
            <AlertIcon size={20} />
            Não foi possível gerar as sugestões.
          </div>
          <p>Falha simulada pelo controle de teste. Sua entrada continua aqui, é só tentar de novo.</p>
          <button type="button" className="btn-secondary" onClick={onRetry}>
            Tentar novamente
          </button>
        </div>
      )}

      {status.status === 'idle' && result && (
        <>
          <PreferenceSummary preferences={preferences} />
          <SuccessBody workspace={workspace} result={result} preferences={preferences} onCopied={() => onToast('Mensagem copiada.')} />
          <SaveBar workspace={workspace} result={result} onToast={onToast} />
        </>
      )}
    </section>
  )
}

function Loading() {
  return (
    <div className="loading">
      <p className="loading-label" role="status">
        <span className="spinner" aria-hidden="true" /> Montando as sugestões de exemplo…
      </p>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="card skeleton" aria-hidden="true">
          <span className={`sk-line ${i === 0 ? 'w-40' : 'w-25'}`} />
          <span className="sk-line" />
          <span className={`sk-line ${i === 0 ? 'w-70' : 'w-60'}`} />
        </div>
      ))}
    </div>
  )
}

function PreferenceSummary({ preferences }: { preferences: Preferences }) {
  const { setSection } = useActions()
  if (!preferences.tone && !preferences.detail) return null
  const parts = [
    preferences.tone && `tom padrão ${TONE_PREF_OPTIONS.find((o) => o.id === preferences.tone)?.label}`,
    preferences.detail && `explicação ${DETAIL_OPTIONS.find((o) => o.id === preferences.detail)?.label.toLowerCase()}`,
  ].filter(Boolean)
  return (
    <p className="pref-summary">
      Preferências: {parts.join(' · ')}.{' '}
      <button type="button" className="btn-inline" onClick={() => setSection('conversations')}>
        Alterar
      </button>
    </p>
  )
}

function SuccessBody({
  workspace,
  result,
  preferences,
  onCopied,
}: {
  workspace: WorkspaceId
  result: ResultState
  preferences: Preferences
  onCopied: () => void
}) {
  const { setVersion, addThreadEntry } = useActions()
  const { request } = result
  const content: DemoContent = request.content
  const { source } = request
  const detail = preferences.detail
  // Chave por resultado: gerar de novo ou abrir outra conversa zera painéis abertos e estados de cópia.
  const key = `run-${result.runId}`

  return (
    <div className="results-body">
      {source !== 'example' && (
        <p className="own-input-note">
          <strong>{OWN_INPUT_MESSAGES[source]}</strong> Para você testar a interface, as mensagens abaixo respondem a um
          cenário de exemplo, não à sua conversa.
        </p>
      )}

      <div className="card reading">
        <h3 className="card-title">Leitura do cenário de exemplo</h3>
        <p className="reading-scenario">{content.summary}</p>
        <p className="reading-text">{explain(content.reading, detail)}</p>
        {detail === 'detailed' && (
          <p className="reading-next">
            <strong>Próximo passo:</strong> {content.followUps.next}
          </p>
        )}
      </div>

      <div className="suggestions">
        {orderTones(preferences.tone).map((t) => (
          <SuggestionCard
            key={`${key}-${t.id}`}
            id={`suggestion-${t.id}`}
            tone={t.label}
            card={content.cards[t.id]}
            recommended={content.recommended === t.id}
            reason={content.reason}
            feedbackKey={`${request.feedbackKey}/${t.id}`}
            version={result.versions[t.id]}
            onVersionChange={(v) => setVersion(workspace, t.id, v)}
            preferred={preferences.tone === t.id}
            detail={detail}
            onCopied={onCopied}
          />
        ))}
      </div>

      <FollowUp
        key={key}
        scenario={content}
        entries={result.thread}
        onAdd={(entry) => addThreadEntry(workspace, entry)}
        detail={detail}
        onCopied={onCopied}
      />
    </div>
  )
}

const timeFmt = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })

function SaveBar({ workspace, result, onToast }: { workspace: WorkspaceId; result: ResultState; onToast: (m: string) => void }) {
  const { saveConversation, startNewConversation } = useActions()
  const conversation = useAppState((s) => {
    const id = s.workspaces[workspace].conversationId
    return id ? (s.conversations.find((c) => c.id === id) ?? null) : null
  })
  const existingNames = useAppState((s) => s.conversations)
  const [naming, setNaming] = useState(false)
  const [name, setName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (naming) inputRef.current?.select()
  }, [naming])

  function startNaming() {
    const base = result.request.label
    let suggestion = base
    const taken = new Set(existingNames.map((c) => c.name))
    for (let n = 2; taken.has(suggestion); n++) suggestion = `${base} (${n})`
    setName(suggestion)
    setNaming(true)
  }

  function save(e?: FormEvent) {
    e?.preventDefault()
    if (!conversation && !name.trim()) return
    const res = saveConversation(workspace, conversation ? undefined : name)
    if (!res) return
    setNaming(false)
    onToast(res.created ? 'Conversa salva em Minhas conversas.' : 'Conversa atualizada.')
  }

  return (
    <div className="card save-bar">
      {conversation ? (
        <>
          <p className="save-status">
            Salva como <strong>“{conversation.name}”</strong>
            <span className="save-time">
              {conversation.updatedAt > conversation.createdAt ? 'Atualizada' : 'Salva'} às {timeFmt.format(conversation.updatedAt)}
            </span>
          </p>
          <div className="preview-actions">
            <button type="button" className="btn-secondary" onClick={() => save()}>
              Salvar alterações
            </button>
            <button type="button" className="btn-secondary" onClick={() => startNewConversation(workspace)}>
              Nova conversa
            </button>
          </div>
        </>
      ) : naming ? (
        <form className="save-form" onSubmit={save}>
          <label htmlFor={`save-name-${workspace}`} className="field-label">
            Nome da conversa
          </label>
          <input
            ref={inputRef}
            id={`save-name-${workspace}`}
            className="text-input"
            type="text"
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="preview-actions">
            <button type="button" className="btn-secondary" onClick={() => setNaming(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-save" disabled={!name.trim()}>
              Salvar
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn-save" onClick={startNaming}>
          Salvar conversa
        </button>
      )}
      <p className="temp-notice">{TEMP_HISTORY_NOTICE}</p>
    </div>
  )
}
