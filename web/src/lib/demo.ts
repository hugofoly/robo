import { DEMO_SCENARIOS } from '../data/assistantScenarios'
import { AUDIO_EXAMPLE } from '../data/audioExample'
import type { Adjustment, DemoCard, DemoContent, DemoScenario, Tone } from '../data/types'
import { GOALS, TABS, type AssistantDraft, type AssistantTab, type Goal } from './assistant'

// Os exemplos (dados) ficam em src/data; aqui fica só a lógica que escolhe e monta a demonstração.
export type { Tone, Adjustment, DemoCard, FollowUps, DemoContent, DemoScenario } from '../data/types'
export { card } from '../data/types'
export { DEMO_SCENARIOS }

export const DEMO_NOTICE = 'Demonstração: as respostas são exemplos e não analisam o conteúdo enviado.'

export const TONES: { id: Tone; label: string }[] = [
  { id: 'light', label: 'Leve' },
  { id: 'confident', label: 'Confiante' },
  { id: 'bold', label: 'Ousada' },
]

export const ADJUSTMENTS: { id: Adjustment; label: string }[] = [
  { id: 'shorter', label: 'Mais curto' },
  { id: 'natural', label: 'Mais natural' },
  { id: 'bolder', label: 'Mais provocativo' },
  { id: 'softer', label: 'Menos ousado' },
  { id: 'another', label: 'Outra opção' },
]

/** Versão exibida no card: a original ou um dos ajustes já escritos. */
export type Version = 'original' | Adjustment

export function cardText(c: DemoCard, version: Version): string {
  return version === 'original' ? c.text : c.variants[version]
}

export function getScenario(tab: AssistantTab, goal: Goal): DemoScenario {
  return DEMO_SCENARIOS[tab][goal]
}

/** Cenário do exemplo de áudio identificado (a transcrição fictícia é da Marina). */
export const AUDIO_EXAMPLE_TARGET = { tab: 'reply', goal: 'continue' } as const

/**
 * Verdadeiro só quando a entrada é exatamente o exemplo da aba e do objetivo atuais.
 * Qualquer edição, print, áudio próprio ou outra combinação conta como entrada própria, que nunca recebe leitura.
 */
export function isUsingExample(draft: AssistantDraft): boolean {
  if (draft.mode === 'audio') {
    return (
      draft.audio?.kind === 'example' &&
      draft.tab === AUDIO_EXAMPLE_TARGET.tab &&
      draft.goal === AUDIO_EXAMPLE_TARGET.goal &&
      draft.audio.transcript.trim() === AUDIO_EXAMPLE.transcript &&
      draft.context.trim() === getScenario(AUDIO_EXAMPLE_TARGET.tab, AUDIO_EXAMPLE_TARGET.goal).context
    )
  }
  const scenario = getScenario(draft.tab, draft.goal)
  return draft.mode === 'text' && draft.text.trim() === scenario.text && draft.context.trim() === scenario.context
}

export type DemoSource = 'example' | 'own-image' | 'own-text' | 'own-audio' | 'own-transcript'

/** Aviso exibido no resultado quando a entrada não é o exemplo: nada foi analisado. */
export const OWN_INPUT_MESSAGES: Record<Exclude<DemoSource, 'example'>, string> = {
  'own-image': 'Seu print não foi analisado.',
  'own-text': 'Seu texto não foi analisado.',
  'own-audio': 'Seu áudio não foi transcrito nem analisado.',
  'own-transcript': 'Essa transcrição não é a do exemplo e não foi analisada.',
}

export interface DemoRequest {
  content: DemoContent
  /** Rótulo do resultado, ex.: "Responder conversa · Flertar". */
  label: string
  /** Partes do rótulo, usadas ao salvar: modo (aba ou modo especial) e objetivo/caminho. */
  modeLabel: string
  goalLabel: string | null
  /** Prefixo da chave de feedback na sessão. */
  feedbackKey: string
  source: DemoSource
}

function sourceOf(draft: AssistantDraft): DemoSource {
  if (isUsingExample(draft)) return 'example'
  if (draft.mode === 'image') return 'own-image'
  if (draft.mode === 'audio') return draft.audio?.kind === 'example' ? 'own-transcript' : 'own-audio'
  return 'own-text'
}

export function toDemoRequest(draft: AssistantDraft): DemoRequest {
  const tab = TABS.find((t) => t.id === draft.tab)!.label
  const goal = GOALS.find((g) => g.id === draft.goal)!.label
  return {
    content: getScenario(draft.tab, draft.goal),
    label: `${tab} · ${goal}`,
    modeLabel: tab,
    goalLabel: goal,
    feedbackKey: `${draft.tab}/${draft.goal}`,
    source: sourceOf(draft),
  }
}
