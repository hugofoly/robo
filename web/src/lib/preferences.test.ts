import { describe, expect, it } from 'vitest'
import { GOALS, TABS } from './assistant'
import { getScenario } from './demo'
import { allModeContents } from './modes'
import { explain, firstSentence, orderTones } from './preferences'

const contents = [...TABS.flatMap((t) => GOALS.map((g) => getScenario(t.id, g.id))), ...allModeContents().map((m) => m.content)]

describe('preferências', () => {
  it('tom padrão vem primeiro, sem perder os outros', () => {
    expect(orderTones(null).map((t) => t.id)).toEqual(['light', 'confident', 'bold'])
    expect(orderTones('bold').map((t) => t.id)).toEqual(['bold', 'light', 'confident'])
    expect(orderTones('confident').map((t) => t.id)).toEqual(['confident', 'light', 'bold'])
  })

  it('primeira frase', () => {
    expect(firstSentence('Uma. Duas.')).toBe('Uma.')
    expect(firstSentence('Sem ponto')).toBe('Sem ponto')
    expect(firstSentence('Ela disse ("oi, tudo?"). Depois.')).toBe('Ela disse ("oi, tudo?").')
    expect(firstSentence('Uma ideia só: com detalhe.')).toBe('Uma ideia só.')
  })

  it.each(contents.map((c) => [c.summary, c] as const))('explicação curta encurta a leitura: %s', (_, c) => {
    const short = explain(c.reading, 'short')
    expect(short.length).toBeLessThan(c.reading.length)
    expect(short).toMatch(/[.!?]$/)
    expect(explain(c.reading, null)).toBe(c.reading)
    expect(explain(c.reading, 'detailed')).toBe(c.reading)
  })
})
