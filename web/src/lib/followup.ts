import type { DemoContent } from './demo'

export type Shortcut = 'why' | 'next' | 'her-reply'

export const SHORTCUTS: { id: Shortcut; label: string }[] = [
  { id: 'why', label: 'Por que essa resposta?' },
  { id: 'next', label: 'O que faço depois?' },
  { id: 'her-reply', label: 'Ela respondeu isso.' },
]

export type FollowUpAnswer =
  | { kind: 'why'; text: string }
  | { kind: 'next'; text: string }
  | { kind: 'her-reply'; message: string; reading: string; suggestion: string }
  /** Pergunta livre: não há resposta preparada e nada é interpretado. */
  | { kind: 'not-connected' }

const normalize = (s: string) =>
  s
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/**
 * Reconhece apenas o texto exato de um atalho (ignorando caixa, acento e pontuação).
 * Não tenta entender perguntas parecidas: isso simularia uma compreensão que a demo não tem.
 */
export function matchShortcut(input: string): Shortcut | null {
  const n = normalize(input)
  return SHORTCUTS.find((s) => normalize(s.label) === n)?.id ?? null
}

export function answerFor(scenario: DemoContent, shortcut: Shortcut | null): FollowUpAnswer {
  switch (shortcut) {
    case 'why':
      return { kind: 'why', text: scenario.followUps.why }
    case 'next':
      return { kind: 'next', text: scenario.followUps.next }
    case 'her-reply':
      return { kind: 'her-reply', ...scenario.followUps.herReply }
    default:
      return { kind: 'not-connected' }
  }
}
