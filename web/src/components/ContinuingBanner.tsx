import { useActions, useAppState } from '../lib/StoreProvider'
import type { WorkspaceId } from '../lib/store'
import { BubblesIcon } from './Icons'

/** Mostra qual conversa salva esta área está continuando, e o que não foi salvo (arquivos). */
export function ContinuingBanner({ workspace }: { workspace: WorkspaceId }) {
  const conversation = useAppState((s) => {
    const id = s.workspaces[workspace].conversationId
    return id ? (s.conversations.find((c) => c.id === id) ?? null) : null
  })
  const { startNewConversation } = useActions()
  if (!conversation) return null
  const input = conversation.input
  const missing =
    input.kind === 'assistant' && input.hadImage
      ? 'O print desta conversa não foi salvo: envie de novo se quiser.'
      : input.kind === 'assistant' && input.hadAudio
        ? 'O áudio desta conversa não foi salvo: grave ou envie de novo se quiser.'
        : null

  return (
    <div className="continuing" role="status">
      <BubblesIcon size={18} />
      <div className="continuing-text">
        <p>
          Continuando <strong>“{conversation.name}”</strong>
        </p>
        {missing && <p className="continuing-note">{missing}</p>}
      </div>
      <button type="button" className="btn-inline" onClick={() => startNewConversation(workspace)}>
        Nova conversa
      </button>
    </div>
  )
}
