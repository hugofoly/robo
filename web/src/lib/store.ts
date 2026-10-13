import { INITIAL_DRAFT, type AssistantDraft } from './assistant'
import type { DemoRequest, Tone, Version } from './demo'
import { nextFeedback, type Feedback, type Verdict, type Reason } from './feedback'
import { normalize, type FollowUpEntry } from './followup'
import { emptyModeDraft, type ModeDraft, type ModeId } from './modes'
import { NO_PREFERENCES, type Preferences } from './preferences'

/**
 * Estado compartilhado do app, só em memória. Não usa localStorage, sessionStorage, IndexedDB,
 * cookies nem rede: recarregar a página cria um store novo, vazio.
 */

export type Section = 'assistant' | 'modes' | 'conversations'
export type WorkspaceId = 'assistant' | `mode:${ModeId}`

export const ORIGINAL_VERSIONS: Record<Tone, Version> = { light: 'original', confident: 'original', bold: 'original' }

/** Resultado atual de uma área: sugestões (com a versão escolhida em cada card) e acompanhamento. */
export interface ResultState {
  request: DemoRequest
  /** Entrada (sem arquivos) que gerou este resultado: é o que "continuar" restaura. */
  input: InputSnapshot
  runId: number
  versions: Record<Tone, Version>
  thread: FollowUpEntry[]
}

export interface Workspace {
  result: ResultState | null
  /** Conversa salva que esta área está continuando. Salvar de novo atualiza esta. */
  conversationId: string | null
}

/** Entrada salva, sem arquivos: print e áudio próprios nunca entram aqui. */
export type InputSnapshot =
  | { kind: 'assistant'; draft: AssistantDraft; hadImage: boolean; hadAudio: boolean }
  | { kind: 'mode'; mode: ModeId; draft: ModeDraft }

export interface SavedConversation {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  workspace: WorkspaceId
  /** Ex.: "Responder conversa" ou "Pós-Date". */
  modeLabel: string
  /** Ex.: "Flertar" ou "Casual"; null quando o modo não tem objetivo. */
  goalLabel: string | null
  /** Contexto em texto (o que o usuário escreveu), para listar e restaurar. */
  context: string
  input: InputSnapshot
  result: ResultState
}

export interface AppState {
  section: Section
  openMode: ModeId | null
  assistantDraft: AssistantDraft
  modeDrafts: Record<ModeId, ModeDraft>
  workspaces: Record<WorkspaceId, Workspace>
  conversations: SavedConversation[]
  preferences: Preferences
  feedback: Record<string, Feedback>
}

const MODE_IDS: ModeId[] = ['quick-date', 'post-date', 'nudes', 'express']
const emptyWorkspace = (): Workspace => ({ result: null, conversationId: null })

export function initialState(): AppState {
  return {
    section: 'assistant',
    openMode: null,
    assistantDraft: INITIAL_DRAFT,
    modeDrafts: Object.fromEntries(MODE_IDS.map((m) => [m, emptyModeDraft()])) as Record<ModeId, ModeDraft>,
    workspaces: Object.fromEntries(
      (['assistant', ...MODE_IDS.map((m) => `mode:${m}`)] as WorkspaceId[]).map((w) => [w, emptyWorkspace()]),
    ) as Record<WorkspaceId, Workspace>,
    conversations: [],
    preferences: NO_PREFERENCES,
    feedback: {},
  }
}

/** Remove arquivos da entrada antes de salvar. O exemplo de áudio é só texto fictício e pode ficar. */
export function snapshotAssistantDraft(draft: AssistantDraft): InputSnapshot {
  return {
    kind: 'assistant',
    draft: { ...draft, image: null, audio: draft.audio?.kind === 'example' ? draft.audio : null },
    hadImage: draft.image !== null,
    hadAudio: draft.audio?.kind === 'own',
  }
}

export function searchConversations(list: SavedConversation[], query: string): SavedConversation[] {
  const q = normalize(query)
  if (!q) return list
  return list.filter((c) => normalize(c.name).includes(q))
}

/** Contexto em texto para listar: o que o usuário escreveu, nunca arquivos. */
export function contextOf(input: InputSnapshot): string {
  if (input.kind === 'assistant') {
    const d = input.draft
    const transcript = d.audio?.kind === 'example' ? d.audio.transcript : ''
    return [d.context, d.mode === 'text' ? d.text : transcript].map((v) => v.trim()).filter(Boolean).join(' · ')
  }
  return Object.values(input.draft.values).map((v) => v.trim()).filter(Boolean).join(' · ')
}

type Listener = () => void

export function createStore(initial: AppState = initialState()) {
  let state = initial
  let runCounter = 0
  let idCounter = 0
  const listeners = new Set<Listener>()

  function set(next: AppState) {
    state = next
    listeners.forEach((l) => l())
  }

  function updateWorkspace(id: WorkspaceId, fn: (w: Workspace) => Workspace) {
    set({ ...state, workspaces: { ...state.workspaces, [id]: fn(state.workspaces[id]) } })
  }

  function updateResult(id: WorkspaceId, fn: (r: ResultState) => ResultState) {
    updateWorkspace(id, (w) => (w.result ? { ...w, result: fn(w.result) } : w))
  }

  const actions = {
    setSection(section: Section) {
      // Como numa tab bar do iOS: tocar de novo em "Modos especiais" volta para a lista.
      const openMode = section === 'modes' && state.section === 'modes' ? null : state.openMode
      set({ ...state, section, openMode })
    },
    setOpenMode(openMode: ModeId | null) {
      set({ ...state, openMode })
    },
    updateAssistantDraft(fn: (d: AssistantDraft) => AssistantDraft) {
      set({ ...state, assistantDraft: fn(state.assistantDraft) })
    },
    updateModeDraft(mode: ModeId, fn: (d: ModeDraft) => ModeDraft) {
      set({ ...state, modeDrafts: { ...state.modeDrafts, [mode]: fn(state.modeDrafts[mode]) } })
    },

    /** Novo resultado gerado. Continua vinculado à conversa que a área estiver continuando. */
    setResult(id: WorkspaceId, request: DemoRequest, input: InputSnapshot) {
      runCounter += 1
      updateWorkspace(id, (w) => ({
        ...w,
        result: { request, input, runId: runCounter, versions: { ...ORIGINAL_VERSIONS }, thread: [] },
      }))
    },
    setVersion(id: WorkspaceId, tone: Tone, version: Version) {
      updateResult(id, (r) => ({ ...r, versions: { ...r.versions, [tone]: version } }))
    },
    addThreadEntry(id: WorkspaceId, entry: Omit<FollowUpEntry, 'id'>) {
      updateResult(id, (r) => ({ ...r, thread: [...r.thread, { ...entry, id: (r.thread.at(-1)?.id ?? 0) + 1 }] }))
    },
    /** "Nova conversa": solta o vínculo e limpa o resultado; a entrada continua. */
    startNewConversation(id: WorkspaceId) {
      updateWorkspace(id, () => emptyWorkspace())
    },

    /**
     * Salva o resultado atual da área. Se a área já continua uma conversa salva, atualiza a mesma
     * (sem duplicar); senão cria uma nova e passa a continuar ela. Retorna o id e se foi criada.
     */
    saveConversation(id: WorkspaceId, name?: string): { id: string; created: boolean } | null {
      const ws = state.workspaces[id]
      if (!ws.result) return null
      const { request, input } = ws.result
      const meta = { modeLabel: request.modeLabel, goalLabel: request.goalLabel, context: contextOf(input), input }
      const now = Date.now()
      const existing = ws.conversationId ? state.conversations.find((c) => c.id === ws.conversationId) : undefined
      if (existing) {
        const updated: SavedConversation = {
          ...existing,
          name: name?.trim() || existing.name,
          updatedAt: now,
          modeLabel: meta.modeLabel,
          goalLabel: meta.goalLabel,
          context: meta.context,
          input: meta.input,
          result: ws.result,
        }
        set({ ...state, conversations: state.conversations.map((c) => (c.id === existing.id ? updated : c)) })
        return { id: existing.id, created: false }
      }
      idCounter += 1
      const conv: SavedConversation = {
        id: `c${idCounter}`,
        name: name?.trim() || meta.modeLabel,
        createdAt: now,
        updatedAt: now,
        workspace: id,
        modeLabel: meta.modeLabel,
        goalLabel: meta.goalLabel,
        context: meta.context,
        input: meta.input,
        result: ws.result,
      }
      set({
        ...state,
        conversations: [conv, ...state.conversations],
        workspaces: { ...state.workspaces, [id]: { ...ws, conversationId: conv.id } },
      })
      return { id: conv.id, created: true }
    },

    renameConversation(convId: string, name: string) {
      const trimmed = name.trim()
      if (!trimmed) return
      set({ ...state, conversations: state.conversations.map((c) => (c.id === convId ? { ...c, name: trimmed } : c)) })
    },

    deleteConversation(convId: string) {
      const workspaces = Object.fromEntries(
        Object.entries(state.workspaces).map(([k, w]) => [k, w.conversationId === convId ? { ...w, conversationId: null } : w]),
      ) as Record<WorkspaceId, Workspace>
      set({ ...state, conversations: state.conversations.filter((c) => c.id !== convId), workspaces })
    },

    /**
     * Abre uma conversa para continuar: restaura a entrada (sem arquivos) e o resultado salvo na área
     * de origem e navega até ela. Se a área já continua esta conversa, só navega (mantém o progresso).
     */
    openConversation(convId: string) {
      const conv = state.conversations.find((c) => c.id === convId)
      if (!conv) return
      const ws = state.workspaces[conv.workspace]
      const alreadyHere = ws.conversationId === conv.id && ws.result !== null
      const next: AppState = { ...state }
      if (!alreadyHere) {
        next.workspaces = { ...state.workspaces, [conv.workspace]: { result: conv.result, conversationId: conv.id } }
        if (conv.input.kind === 'assistant') {
          revokeDraftUrls(state.assistantDraft)
          next.assistantDraft = { ...conv.input.draft, audio: conv.input.draft.audio ? { ...conv.input.draft.audio } : null }
        } else {
          next.modeDrafts = { ...state.modeDrafts, [conv.input.mode]: { ...conv.input.draft, values: { ...conv.input.draft.values } } }
        }
      }
      if (conv.input.kind === 'assistant') {
        next.section = 'assistant'
      } else {
        next.section = 'modes'
        next.openMode = conv.input.mode
      }
      set(next)
    },

    setPreferences(prefs: Partial<Preferences>) {
      set({ ...state, preferences: { ...state.preferences, ...prefs } })
    },

    updateFeedback(key: string, action: { verdict: Verdict } | { toggleReason: Reason }) {
      const value = nextFeedback(state.feedback[key] ?? null, action)
      const feedback = { ...state.feedback }
      if (value) feedback[key] = value
      else delete feedback[key]
      set({ ...state, feedback })
    },
  }

  return {
    getState: () => state,
    subscribe(listener: Listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    actions,
  }
}

function revokeDraftUrls(draft: AssistantDraft) {
  if (draft.image) URL.revokeObjectURL(draft.image.previewUrl)
  if (draft.audio?.kind === 'own') URL.revokeObjectURL(draft.audio.url)
}

export type Store = ReturnType<typeof createStore>
export type Actions = Store['actions']

/** A área (workspace) tem algo que seria substituído ao abrir outra conversa nela? */
export function workspaceHasUnsavedWork(state: AppState, id: WorkspaceId, convId: string): boolean {
  const ws = state.workspaces[id]
  if (ws.conversationId === convId) return false
  if (ws.result && ws.conversationId === null) return true
  if (id === 'assistant') {
    const d = state.assistantDraft
    return ws.conversationId === null && (d.text.trim() !== '' || d.context.trim() !== '' || d.image !== null || d.audio !== null)
  }
  const mode = id.slice('mode:'.length) as ModeId
  const md = state.modeDrafts[mode]
  return ws.conversationId === null && Object.values(md.values).some((v) => v.trim() !== '')
}
