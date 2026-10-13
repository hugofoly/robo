import { MATCH_EXAMPLE } from '../data/matchExample'
import { EXPRESS, NUDES, POST_DATE, QUICK_DATE, type ModeExample } from '../data/modeExamples'
import type { DemoContent, DemoRequest } from './demo'

export type ModeId = 'quick-date' | 'post-date' | 'nudes' | 'express' | 'match'
export type PostDatePath = 'casual' | 'relationship' | 'second-date'

export const POST_DATE_PATHS: { id: PostDatePath; label: string }[] = [
  { id: 'casual', label: 'Casual' },
  { id: 'relationship', label: 'Buscar namoro' },
  { id: 'second-date', label: 'Tentar segundo encontro' },
]

export interface ModeField {
  id: string
  label: string
  /** `choice` vira um seletor segmentado; o valor salvo é o rótulo da opção. */
  kind: 'textarea' | 'text' | 'choice'
  placeholder: string
  required: boolean
  options?: string[]
}

export interface ModeDef {
  id: ModeId
  /** Onde o modo aparece: na lista de Modos especiais ou numa aba própria (Robô de Match). */
  section: 'modes' | 'match'
  title: string
  /** Uma linha na lista de modos. */
  tagline: string
  description: string
  fields: ModeField[]
  /** Exige confirmar que os dois são maiores de 18. */
  adultConfirm: boolean
  /** Regras exibidas em destaque no topo do formulário. */
  guidelines?: string[]
}

export const MODES: ModeDef[] = [
  {
    id: 'quick-date',
    section: 'modes',
    title: 'Date Rápido',
    tagline: 'Transforme o papo em encontro com dia e hora.',
    description: 'Conte com quem você está falando e quando você pode. As sugestões já chegam com convite e horário.',
    adultConfirm: false,
    fields: [
      {
        id: 'context',
        label: 'Contexto',
        kind: 'textarea',
        placeholder: 'Com quem você está falando, há quanto tempo e do que ela gosta.',
        required: true,
      },
      {
        id: 'availability',
        label: 'Sua disponibilidade',
        kind: 'text',
        placeholder: 'Ex.: quinta depois das 19h ou sábado à tarde',
        required: true,
      },
    ],
  },
  {
    id: 'post-date',
    section: 'modes',
    title: 'Pós-Date',
    tagline: 'A mensagem do dia seguinte, do jeito que você quer seguir.',
    description: 'Escolha o caminho que você quer e conte como foi o encontro.',
    adultConfirm: false,
    fields: [
      {
        id: 'date',
        label: 'Como foi o date?',
        kind: 'textarea',
        placeholder: 'Onde foram, como foi a conversa, como terminou.',
        required: true,
      },
    ],
  },
  {
    id: 'nudes',
    section: 'modes',
    title: 'Protocolo Nudes',
    tagline: 'Conversa consensual entre adultos, com limites claros.',
    description: 'Ajuda a perguntar com clareza, combinar limites e aceitar um não. Não é para pedir nem enviar imagens.',
    adultConfirm: true,
    guidelines: [
      'Só entre adultos e com consentimento claro dos dois. Sinal de flerte não é consentimento.',
      'Este modo não aceita imagens: não há campo de upload e nada é enviado.',
      'Nunca mande conteúdo íntimo sem pedido, nunca insista e nunca compartilhe o que recebeu.',
      'Um não, silêncio ou mudança de ideia encerram o assunto.',
    ],
    fields: [
      {
        id: 'context',
        label: 'Como está a conversa?',
        kind: 'textarea',
        placeholder: 'Há quanto tempo vocês conversam, se já se encontraram e como está o clima.',
        required: true,
      },
    ],
  },
  {
    id: 'express',
    section: 'modes',
    title: 'Sexo Express',
    tagline: 'Fale de interesse em intimidade sem ser gráfico.',
    description: 'Ajuda a comunicar a vontade com clareza e respeito, sempre com espaço para ela recusar.',
    adultConfirm: true,
    guidelines: [
      'Só entre adultos. Interesse se comunica com clareza, sem descrições gráficas.',
      'Todo convite precisa deixar o não tão fácil quanto o sim.',
      'Recusa, hesitação ou silêncio são respostas: aceite e não insista.',
    ],
    fields: [
      {
        id: 'context',
        label: 'Como está a relação de vocês?',
        kind: 'textarea',
        placeholder: 'Quantas vezes já se viram, como foi o último encontro, o que ela disse.',
        required: true,
      },
    ],
  },
  {
    id: 'match',
    section: 'match',
    title: 'Robô de Match',
    tagline: 'Bio e perfil que geram match.',
    description: 'Conte sobre você e cole sua bio atual. Você recebe três bios novas e o que ajustar no perfil.',
    adultConfirm: false,
    fields: [
      { id: 'app', label: 'App', kind: 'choice', placeholder: '', required: true, options: ['Tinder', 'Bumble', 'Hinge'] },
      {
        id: 'about',
        label: 'Sobre você',
        kind: 'textarea',
        placeholder: 'Profissão, hobbies, manias, o que você faz no fim de semana.',
        required: true,
      },
      { id: 'bio', label: 'Bio atual', kind: 'textarea', placeholder: 'Cole a bio que você usa hoje.', required: false },
    ],
  }
]

/** Modos listados em "Modos especiais" (o Robô de Match tem aba própria). */
export const SPECIAL_MODES = MODES.filter((m) => m.section === 'modes')

export function getMode(id: ModeId): ModeDef {
  return MODES.find((m) => m.id === id)!
}

type Values = Record<string, string>

function exampleFor(mode: ModeId, path: PostDatePath): ModeExample {
  switch (mode) {
    case 'quick-date':
      return QUICK_DATE
    case 'post-date':
      return POST_DATE[path]
    case 'nudes':
      return NUDES
    case 'express':
      return EXPRESS
    case 'match':
      return MATCH_EXAMPLE
  }
}

export function getModeContent(mode: ModeId, path: PostDatePath = 'casual'): DemoContent {
  return exampleFor(mode, path).content
}

export function getModeExampleValues(mode: ModeId, path: PostDatePath = 'casual'): Values {
  return exampleFor(mode, path).values
}

/** Todos os conteúdos de modos, para testes e checagens de unicidade. */
export function allModeContents(): { key: string; content: DemoContent }[] {
  return [
    { key: 'quick-date', content: QUICK_DATE.content },
    ...POST_DATE_PATHS.map((p) => ({ key: `post-date/${p.id}`, content: POST_DATE[p.id].content })),
    { key: 'nudes', content: NUDES.content },
    { key: 'express', content: EXPRESS.content },
    { key: 'match', content: MATCH_EXAMPLE.content },
  ]
}

// ---------- Formulário ----------

export interface ModeDraft {
  values: Values
  path: PostDatePath
  adult: boolean
}

export const emptyModeDraft = (): ModeDraft => ({ values: {}, path: 'casual', adult: false })

/** Rascunho inicial de um modo: campos de escolha já vêm com a primeira opção (ex.: App = Tinder). */
export function defaultModeDraft(mode: ModeId): ModeDraft {
  const values = Object.fromEntries(
    getMode(mode)
      .fields.filter((f) => f.kind === 'choice' && f.options?.length)
      .map((f) => [f.id, f.options![0]]),
  )
  return { ...emptyModeDraft(), values }
}

/** Há texto digitado pelo usuário (campos de escolha não contam). */
export function hasTypedModeInput(def: ModeDef, draft: ModeDraft): boolean {
  return def.fields.some((f) => f.kind !== 'choice' && (draft.values[f.id] ?? '').trim() !== '')
}

export function isModeValid(def: ModeDef, draft: ModeDraft): boolean {
  const fieldsOk = def.fields.every((f) => !f.required || (draft.values[f.id] ?? '').trim().length > 0)
  return fieldsOk && (!def.adultConfirm || draft.adult)
}

/** Exemplo intacto do modo (e do caminho, no Pós-Date). Qualquer edição conta como entrada própria. */
export function isModeExample(def: ModeDef, draft: ModeDraft): boolean {
  const example = getModeExampleValues(def.id, draft.path)
  return def.fields.every((f) => (draft.values[f.id] ?? '').trim() === (example[f.id] ?? ''))
}

export function hasOwnModeInput(def: ModeDef, draft: ModeDraft): boolean {
  return hasTypedModeInput(def, draft) && !isModeExample(def, draft)
}

export function toModeRequest(def: ModeDef, draft: ModeDraft): DemoRequest {
  const isPostDate = def.id === 'post-date'
  const pathLabel = POST_DATE_PATHS.find((p) => p.id === draft.path)?.label
  // Pós-Date mostra o caminho; Robô de Match mostra o app escolhido.
  const detail = isPostDate ? (pathLabel ?? null) : def.id === 'match' ? draft.values.app || null : null
  return {
    content: getModeContent(def.id, draft.path),
    label: detail ? `${def.title} · ${detail}` : def.title,
    modeLabel: def.title,
    goalLabel: detail,
    feedbackKey: isPostDate ? `mode/${def.id}/${draft.path}` : `mode/${def.id}`,
    source: isModeExample(def, draft) ? 'example' : 'own-text',
  }
}
