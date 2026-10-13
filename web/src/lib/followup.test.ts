import { describe, expect, it } from 'vitest'
import { getScenario } from './demo'
import { answerFor, matchShortcut } from './followup'

describe('matchShortcut', () => {
  it('reconhece o texto dos atalhos, ignorando caixa, acento e pontuação', () => {
    expect(matchShortcut('Por que essa resposta?')).toBe('why')
    expect(matchShortcut('  por que essa resposta  ')).toBe('why')
    expect(matchShortcut('O QUE FACO DEPOIS')).toBe('next')
    expect(matchShortcut('Ela respondeu isso.')).toBe('her-reply')
  })

  it.each([
    'por que a confiante?',
    'ela respondeu: kkkk tá bom',
    'o que eu faço se ela não responder?',
    'me ajuda com essa conversa',
    'essa resposta',
  ])('não finge entender pergunta livre: "%s"', (q) => {
    expect(matchShortcut(q)).toBeNull()
  })
})

describe('answerFor', () => {
  const scenario = getScenario('story', 'ask-out')

  it('responde atalhos com o exemplo do cenário', () => {
    expect(answerFor(scenario, 'why')).toEqual({ kind: 'why', text: scenario.followUps.why })
    expect(answerFor(scenario, 'next')).toEqual({ kind: 'next', text: scenario.followUps.next })
    expect(answerFor(scenario, 'her-reply')).toMatchObject({ kind: 'her-reply', message: scenario.followUps.herReply!.message })
  })

  it('pergunta livre vira "não conectado", sem conteúdo do cenário', () => {
    expect(answerFor(scenario, null)).toEqual({ kind: 'not-connected' })
  })
})
