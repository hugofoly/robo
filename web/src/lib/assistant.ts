export type AssistantTab = 'reply' | 'opener' | 'story'
export type InputMode = 'image' | 'text' | 'audio'
export type Goal = 'continue' | 'flirt' | 'reconnect' | 'ask-out'

export interface ImageSelection {
  file: File
  /** URL `blob:` local, gerada por URL.createObjectURL. Nunca sai do navegador. */
  previewUrl: string
}

/** Áudio do próprio usuário (gravado ou enviado). Nunca é transcrito nem transmitido. */
export interface OwnAudio {
  kind: 'own'
  origin: 'recording' | 'file'
  blob: Blob
  /** URL `blob:` local para reprodução. */
  url: string
  name: string
  /** Duração conhecida (gravação). Para arquivos, o player lê dos metadados. */
  durationMs: number | null
}

/** Exemplo identificado: não há áudio real, só uma transcrição fictícia editável. */
export interface ExampleAudio {
  kind: 'example'
  transcript: string
}

export type AudioInput = OwnAudio | ExampleAudio

export interface AssistantDraft {
  tab: AssistantTab
  mode: InputMode
  image: ImageSelection | null
  audio: AudioInput | null
  text: string
  context: string
  goal: Goal
}

export const INITIAL_DRAFT: AssistantDraft = {
  tab: 'reply',
  mode: 'image',
  image: null,
  audio: null,
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
  { intro: string; imageHint: string; audioHint: string; textLabel: string; textPlaceholder: string }
> = {
  reply: {
    intro: 'Mande a conversa e receba respostas que mantêm o ritmo.',
    imageHint: 'Print da conversa',
    audioHint: 'Grave contando a conversa ou envie o áudio que você recebeu.',
    textLabel: 'Conversa',
    textPlaceholder: 'Cole a conversa aqui.\nEx.: Ela: adorei a foto da viagem\nEu: valeu! foi em Ilhabela',
  },
  opener: {
    intro: 'Mostre o perfil ou conte o que sabe da pessoa para abrir a conversa.',
    imageHint: 'Print do perfil ou da conversa',
    audioHint: 'Grave contando o que você sabe da pessoa.',
    textLabel: 'Relato',
    textPlaceholder: 'Descreva a pessoa ou cole a bio.\nEx.: Ama trilha, tem um golden e mora em BH.',
  },
  story: {
    intro: 'Envie o story e receba respostas que soam naturais.',
    imageHint: 'Print do story',
    audioHint: 'Grave descrevendo o story.',
    textLabel: 'Relato do story',
    textPlaceholder: 'Descreva o story.\nEx.: Foto num show do Bruno Mars com a legenda "melhor noite".',
  },
}

export function hasValidInput(draft: AssistantDraft): boolean {
  switch (draft.mode) {
    case 'image':
      return draft.image !== null
    case 'audio':
      return draft.audio !== null && (draft.audio.kind === 'own' || draft.audio.transcript.trim().length > 0)
    default:
      return draft.text.trim().length > 0
  }
}
