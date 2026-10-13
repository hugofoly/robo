/**
 * Tipos dos exemplos locais. Estes arquivos (src/data) são só dados: nenhum componente nem lógica.
 * Na integração futura com IA, o conteúdo virá de outra fonte com este mesmo formato.
 */

export type Tone = 'light' | 'confident' | 'bold'

export type Adjustment = 'shorter' | 'natural' | 'bolder' | 'softer' | 'another'

export interface DemoCard {
  text: string
  /** "Por que usar esta?": intenção da mensagem e próximo passo. */
  why: { intent: string; next: string }
  variants: Record<Adjustment, string>
}

export interface FollowUps {
  /** Resposta para "Por que essa resposta?", sobre a mensagem recomendada. */
  why: string
  /** Resposta para "O que faço depois?". */
  next: string
  /** Resposta para "Ela respondeu isso.": uma resposta fictícia dela, a leitura e a sugestão.
   *  Opcional: no Robô de Match (perfil) não há resposta de outra pessoa, e o atalho não aparece. */
  herReply?: { message: string; reading: string; suggestion: string }
}

/** Critério da nota de força do perfil (0–100), com peso na média e a nota antes/depois das sugestões. */
export interface ProfileDimension {
  id: string
  label: string
  /** Peso na média ponderada (os pesos somam 100). */
  weight: number
  now: number
  after: number
  note: string
}

export type PhotoVerdict = 'keep' | 'move' | 'replace'

/** Revisão de perfil do Robô de Match: só existe para o exemplo identificado (fotos fictícias, descritas em texto). */
export interface ProfileReview {
  dimensions: ProfileDimension[]
  photos: { description: string; verdict: PhotoVerdict; note: string }[]
  missing: string[]
  order: string
}

/** Conteúdo de resultado de um cenário fictício, escrito à mão. Nada aqui vem da entrada do usuário. */
export interface DemoContent {
  /** Uma linha descrevendo o cenário, mostrada junto da leitura. */
  summary: string
  reading: string
  cards: Record<Tone, DemoCard>
  recommended: Tone
  reason: string
  followUps: FollowUps
  /** Só no Robô de Match: nota de força do perfil e revisão das fotos do exemplo. */
  profile?: ProfileReview
}

/** Cenário do Assistente: o conteúdo e o exemplo que "Usar exemplo" coloca nos campos. */
export interface DemoScenario extends DemoContent {
  text: string
  context: string
}

export function card(
  text: string,
  intent: string,
  next: string,
  [shorter, natural, bolder, softer, another]: [string, string, string, string, string],
): DemoCard {
  return { text, why: { intent, next }, variants: { shorter, natural, bolder, softer, another } }
}
