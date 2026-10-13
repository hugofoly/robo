import { EXPRESS, NUDES, POST_DATE, QUICK_DATE, type ModeExample } from '../data/modeExamples'
import type { DemoContent, DemoRequest } from './demo'

export type ModeId = 'quick-date' | 'post-date' | 'nudes' | 'express'
export type PostDatePath = 'casual' | 'relationship' | 'second-date'

export const POST_DATE_PATHS: { id: PostDatePath; label: string }[] = [
  { id: 'casual', label: 'Casual' },
  { id: 'relationship', label: 'Buscar namoro' },
  { id: 'second-date', label: 'Tentar segundo encontro' },
]

export interface ModeField {
  id: string
  label: string
  kind: 'textarea' | 'text'
  placeholder: string
  required: boolean
}

export interface ModeDef {
  id: ModeId
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
]

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
  ]
}

// ---------- Formulário ----------

export interface ModeDraft {
  values: Values
  path: PostDatePath
  adult: boolean
}

export const emptyModeDraft = (): ModeDraft => ({ values: {}, path: 'casual', adult: false })

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
  return def.fields.some((f) => (draft.values[f.id] ?? '').trim() !== '') && !isModeExample(def, draft)
}

export function toModeRequest(def: ModeDef, draft: ModeDraft): DemoRequest {
  const isPostDate = def.id === 'post-date'
  const pathLabel = POST_DATE_PATHS.find((p) => p.id === draft.path)?.label
  return {
    content: getModeContent(def.id, draft.path),
    label: isPostDate ? `${def.title} · ${pathLabel}` : def.title,
    modeLabel: def.title,
    goalLabel: isPostDate ? (pathLabel ?? null) : null,
    feedbackKey: isPostDate ? `mode/${def.id}/${draft.path}` : `mode/${def.id}`,
    source: isModeExample(def, draft) ? 'example' : 'own-text',
  }
}
