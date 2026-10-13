import { beforeEach, describe, expect, it } from 'vitest'
import { INITIAL_DRAFT, type AssistantDraft } from './assistant'
import { getScenario, toDemoRequest } from './demo'
import { defaultModeDraft, getMode, getModeExampleValues, toModeRequest } from './modes'
import { createStore, searchConversations, snapshotAssistantDraft, snapshotModeDraft, tabOf, workspaceHasUnsavedWork, type Store } from './store'

const draft: AssistantDraft = {
  ...INITIAL_DRAFT,
  mode: 'text',
  text: getScenario('reply', 'flirt').text,
  context: getScenario('reply', 'flirt').context,
  goal: 'flirt',
}

function generate(store: Store, d: AssistantDraft = draft) {
  store.actions.setResult('assistant', toDemoRequest(d), snapshotAssistantDraft(d))
}

let store: Store
beforeEach(() => {
  store = createStore()
})

describe('store em memória', () => {
  it('gerar sem salvar não cria histórico', () => {
    generate(store)
    expect(store.getState().workspaces.assistant.result).not.toBeNull()
    expect(store.getState().conversations).toHaveLength(0)
  })

  it('salvar registra nome, modo, objetivo, contexto, sugestões e acompanhamento', () => {
    generate(store)
    store.actions.setVersion('assistant', 'bold', 'shorter')
    store.actions.addThreadEntry('assistant', { question: 'O que faço depois?', answer: { kind: 'next', text: 'x' } })
    const res = store.actions.saveConversation('assistant', 'Júlia praia')
    expect(res?.created).toBe(true)
    const [c] = store.getState().conversations
    expect(c.name).toBe('Júlia praia')
    expect(c.modeLabel).toBe('Responder conversa')
    expect(c.goalLabel).toBe('Flertar')
    expect(c.context).toContain('Conversa leve há 2 dias.')
    expect(c.result.versions.bold).toBe('shorter')
    expect(c.result.thread).toHaveLength(1)
    expect(store.getState().workspaces.assistant.conversationId).toBe(c.id)
  })

  it('salvar de novo atualiza a mesma conversa, sem duplicar', () => {
    generate(store)
    store.actions.saveConversation('assistant', 'A')
    store.actions.setVersion('assistant', 'light', 'natural')
    const res = store.actions.saveConversation('assistant')
    expect(res?.created).toBe(false)
    expect(store.getState().conversations).toHaveLength(1)
    expect(store.getState().conversations[0].name).toBe('A')
    expect(store.getState().conversations[0].result.versions.light).toBe('natural')
    // Gerar de novo continua a mesma conversa.
    generate(store)
    store.actions.saveConversation('assistant')
    expect(store.getState().conversations).toHaveLength(1)
  })

  it('a conversa salva não muda até salvar de novo', () => {
    generate(store)
    store.actions.saveConversation('assistant', 'A')
    store.actions.setVersion('assistant', 'light', 'natural')
    expect(store.getState().conversations[0].result.versions.light).toBe('original')
  })

  it('não guarda arquivos de print nem de áudio', () => {
    const withFiles: AssistantDraft = {
      ...draft,
      mode: 'image',
      image: { file: new File(['x'], 'p.png', { type: 'image/png' }), previewUrl: 'blob:p' },
      audio: { kind: 'own', origin: 'recording', blob: new Blob(['a']), url: 'blob:a', name: 'g', durationMs: 1 },
    }
    generate(store, withFiles)
    store.actions.saveConversation('assistant', 'Com arquivos')
    const c = store.getState().conversations[0]
    expect(c.input.kind).toBe('assistant')
    if (c.input.kind !== 'assistant') return
    expect(c.input.draft.image).toBeNull()
    expect(c.input.draft.audio).toBeNull()
    expect(c.input.hadImage).toBe(true)
    expect(c.input.hadAudio).toBe(true)
    expect(JSON.stringify(c, (_, v) => (v instanceof Blob ? 'BLOB' : v))).not.toContain('BLOB')
  })

  it('renomear, buscar pelo nome e excluir (solta o vínculo)', () => {
    generate(store)
    store.actions.saveConversation('assistant', 'Júlia praia')
    store.actions.startNewConversation('assistant')
    store.actions.setResult('mode:quick-date', toModeRequest(getMode('quick-date'), { values: getModeExampleValues('quick-date'), path: 'casual', adult: false }), {
      kind: 'mode',
      mode: 'quick-date',
      draft: { values: getModeExampleValues('quick-date'), path: 'casual', adult: false },
    })
    store.actions.saveConversation('mode:quick-date', 'Bruna vinho')
    const list = store.getState().conversations
    expect(list.map((c) => c.name)).toEqual(['Bruna vinho', 'Júlia praia'])
    expect(searchConversations(list, 'julia').map((c) => c.name)).toEqual(['Júlia praia'])
    expect(searchConversations(list, 'VINHO').map((c) => c.name)).toEqual(['Bruna vinho'])
    expect(searchConversations(list, 'flertar')).toHaveLength(0) // busca é só pelo nome
    const bruna = list[0]
    store.actions.renameConversation(bruna.id, '  Bruna · quinta  ')
    expect(store.getState().conversations[0].name).toBe('Bruna · quinta')
    store.actions.renameConversation(bruna.id, '   ')
    expect(store.getState().conversations[0].name).toBe('Bruna · quinta')
    store.actions.deleteConversation(bruna.id)
    expect(store.getState().conversations).toHaveLength(1)
    expect(store.getState().workspaces['mode:quick-date'].conversationId).toBeNull()
  })

  it('abrir restaura entrada, resultado e navega para a área certa', () => {
    generate(store)
    store.actions.addThreadEntry('assistant', { question: 'q', answer: { kind: 'not-connected' } })
    const { id } = store.actions.saveConversation('assistant', 'Júlia')!
    store.actions.startNewConversation('assistant')
    store.actions.updateAssistantDraft((d) => ({ ...d, text: 'outra coisa', goal: 'continue' }))
    store.actions.setSection('conversations')
    store.actions.openConversation(id)
    const s = store.getState()
    expect(s.section).toBe('assistant')
    expect(s.assistantDraft.text).toBe(draft.text)
    expect(s.assistantDraft.goal).toBe('flirt')
    expect(s.workspaces.assistant.conversationId).toBe(id)
    expect(s.workspaces.assistant.result?.thread).toHaveLength(1)
    expect(s.workspaces.assistant.result?.request.content.summary).toContain('Júlia')
  })

  it('abrir conversa de modo vai para o modo certo', () => {
    const values = getModeExampleValues('post-date', 'second-date')
    const d = { values, path: 'second-date' as const, adult: false }
    store.actions.setResult('mode:post-date', toModeRequest(getMode('post-date'), d), { kind: 'mode', mode: 'post-date', draft: d })
    const { id } = store.actions.saveConversation('mode:post-date', 'Tati')!
    store.actions.startNewConversation('mode:post-date')
    store.actions.updateModeDraft('post-date', () => ({ values: {}, path: 'casual', adult: false }))
    store.actions.openConversation(id)
    const s = store.getState()
    expect(s.section).toBe('modes')
    expect(s.openMode).toBe('post-date')
    expect(s.modeDrafts['post-date'].path).toBe('second-date')
    expect(s.workspaces['mode:post-date'].result?.request.label).toBe('Pós-Date · Tentar segundo encontro')
  })

  it('abrir a conversa que a área já continua mantém o progresso não salvo', () => {
    generate(store)
    const { id } = store.actions.saveConversation('assistant', 'A')!
    store.actions.setVersion('assistant', 'light', 'another')
    store.actions.openConversation(id)
    expect(store.getState().workspaces.assistant.result?.versions.light).toBe('another')
  })

  it('detecta trabalho não salvo antes de abrir outra conversa', () => {
    expect(workspaceHasUnsavedWork(store.getState(), 'assistant', 'x')).toBe(false)
    store.actions.updateAssistantDraft((d) => ({ ...d, text: 'oi' }))
    expect(workspaceHasUnsavedWork(store.getState(), 'assistant', 'x')).toBe(true)
  })

  it('preferências e feedback ficam só no estado', () => {
    store.actions.setPreferences({ tone: 'bold' })
    store.actions.setPreferences({ detail: 'short' })
    expect(store.getState().preferences).toEqual({ tone: 'bold', detail: 'short' })
    store.actions.updateFeedback('k', { verdict: 'skip' })
    store.actions.updateFeedback('k', { toggleReason: 'over' })
    expect(store.getState().feedback.k).toEqual({ verdict: 'skip', reasons: ['over'] })
    // "Recarregar": um store novo começa vazio.
    const fresh = createStore()
    expect(fresh.getState().conversations).toHaveLength(0)
    expect(fresh.getState().preferences).toEqual({ tone: null, detail: null })
    expect(fresh.getState().feedback).toEqual({})
  })
})

describe('Robô de Match e Fotos de Impacto no store', () => {
  it('abrir conversa do Robô de Match vai para a aba Match', () => {
    const s = createStore()
    const d = { ...s.getState().modeDrafts.match, values: getModeExampleValues('match') }
    s.actions.setResult('mode:match', toModeRequest(getMode('match'), d), { kind: 'mode', mode: 'match', draft: d })
    const { id } = s.actions.saveConversation('mode:match', 'Bio Lucas')!
    s.actions.setSection('conversations')
    s.actions.openConversation(id)
    expect(s.getState().section).toBe('match')
    expect(s.getState().conversations[0].goalLabel).toBe('Tinder')
  })

  it('filtro da galeria fica no estado (navegação mantém)', () => {
    const s = createStore()
    s.actions.setPhotoCategory('Viagem')
    s.actions.setSection('assistant')
    expect(s.getState().photoCategory).toBe('Viagem')
    expect(createStore().getState().photoCategory).toBe('all')
  })

  it('app pré-selecionado no Match não conta como trabalho não salvo', () => {
    expect(workspaceHasUnsavedWork(createStore().getState(), 'mode:match', 'x')).toBe(false)
  })
})

describe('abas (como no iOS)', () => {
  it('cada aba lembra onde estava; tocar na aba ativa volta ao início', () => {
    const s = createStore()
    s.actions.setSection('modes')
    s.actions.setOpenMode('express')
    s.actions.selectTab('photos')
    expect(s.getState().section).toBe('photos')
    s.actions.selectTab('assistant')
    expect(s.getState().section).toBe('modes')
    expect(s.getState().openMode).toBe('express')
    s.actions.selectTab('assistant')
    expect(s.getState().section).toBe('assistant')
    expect(s.getState().openMode).toBeNull()
  })

  it('Minhas conversas volta para a tela de origem', () => {
    const s = createStore()
    s.actions.selectTab('match')
    s.actions.setSection('conversations')
    expect(tabOf(s.getState().section)).toBeNull()
    s.actions.goBack()
    expect(s.getState().section).toBe('match')
  })
})

describe('fotos do perfil não são salvas', () => {
  it('snapshot do modo guarda só a quantidade de fotos', () => {
    const photo = { file: new File(['x'], 'eu.jpg', { type: 'image/jpeg' }), previewUrl: 'blob:eu' }
    const snap = snapshotModeDraft('match', { ...defaultModeDraft('match'), photos: [photo, photo, photo] })
    expect(snap.kind).toBe('mode')
    if (snap.kind !== 'mode') return
    expect(snap.draft.photos).toBeUndefined()
    expect(snap.photoCount).toBe(3)
    expect(JSON.stringify(snap)).not.toContain('blob:')
  })
})
