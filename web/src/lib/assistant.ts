export type AssistantTab = 'reply' | 'opener' | 'story'
export type InputMode = 'image' | 'text'
export type Goal = 'continue' | 'flirt' | 'reconnect' | 'ask-out'

export interface ImageSelection {
  file: File
  /** URL `blob:` local, gerada por URL.createObjectURL. Nunca sai do navegador. */
  previewUrl: string
}

export interface AssistantDraft {
  tab: AssistantTab
  mode: InputMode
  image: ImageSelection | null
  text: string
  context: string
  goal: Goal
}

export const INITIAL_DRAFT: AssistantDraft = {
  tab: 'reply',
  mode: 'image',
  image: null,
  text: '',
  context: '',
  goal: 'continue',
}

export const TABS: { id: AssistantTab; label: string }[] = [
  { id: 'reply', label: 'Responder conversa' },
  { id: 'opener', label: 'Puxar assunto' },
  { id: 'story', label: 'Responder story' },
]

export const GOALS: { id: Goal; label: string }[] = [
  { id: 'continue', label: 'Continuar o papo' },
  { id: 'flirt', label: 'Flertar' },
  { id: 'reconnect', label: 'Retomar contato' },
  { id: 'ask-out', label: 'Chamar para sair' },
]

/** Textos que mudam conforme a aba; a entrada do usuário é compartilhada entre elas. */
export const TAB_COPY: Record<
  AssistantTab,
  { intro: string; imageHint: string; textLabel: string; textPlaceholder: string }
> = {
  reply: {
    intro: 'Mande a conversa e receba respostas que mantêm o ritmo.',
    imageHint: 'Print da conversa',
    textLabel: 'Conversa',
    textPlaceholder: 'Cole a conversa aqui.\nEx.: Ela: adorei a foto da viagem\nEu: valeu! foi em Ilhabela',
  },
  opener: {
    intro: 'Mostre o perfil ou conte o que sabe da pessoa para abrir a conversa.',
    imageHint: 'Print do perfil ou da conversa',
    textLabel: 'Relato',
    textPlaceholder: 'Descreva a pessoa ou cole a bio.\nEx.: Ama trilha, tem um golden e mora em BH.',
  },
  story: {
    intro: 'Envie o story e receba respostas que soam naturais.',
    imageHint: 'Print do story',
    textLabel: 'Relato do story',
    textPlaceholder: 'Descreva o story.\nEx.: Foto num show do Bruno Mars com a legenda "melhor noite".',
  },
}

export function hasValidInput(draft: AssistantDraft): boolean {
  return draft.mode === 'image' ? draft.image !== null : draft.text.trim().length > 0
}
