import { describe, expect, it } from 'vitest'
import { GOALS, INITIAL_DRAFT, TABS, type AssistantDraft } from './assistant'
import { DEMO_SCENARIOS, TONES, getScenario, isUsingExample, toDemoRequest } from './demo'

const all = TABS.flatMap((t) => GOALS.map((g) => ({ tab: t.id, goal: g.id, scenario: getScenario(t.id, g.id) })))

describe('cenários de demonstração', () => {
  it('cobre todas as combinações de modo e objetivo', () => {
    expect(all).toHaveLength(12)
    for (const { scenario } of all) expect(scenario).toBeDefined()
  })

  it.each(all)('$tab/$goal tem três mensagens distintas e uma recomendada', ({ scenario }) => {
    const texts = TONES.map((t) => scenario.messages[t.id].trim())
    expect(texts.every((t) => t.length > 0)).toBe(true)
    expect(new Set(texts).size).toBe(3)
    expect(TONES.map((t) => t.id)).toContain(scenario.recommended)
    expect(scenario.reason.length).toBeGreaterThan(0)
    expect(scenario.reading.length).toBeGreaterThan(0)
  })

  it('não repete exemplos entre cenários', () => {
    const texts = all.map((s) => s.scenario.text)
    expect(new Set(texts).size).toBe(texts.length)
    const messages = all.flatMap((s) => Object.values(s.scenario.messages))
    expect(new Set(messages).size).toBe(messages.length)
  })
})

describe('isUsingExample', () => {
  const example = (tab: AssistantDraft['tab'], goal: AssistantDraft['goal']): AssistantDraft => ({
    ...INITIAL_DRAFT,
    tab,
    goal,
    mode: 'text',
    text: DEMO_SCENARIOS[tab][goal].text,
    context: DEMO_SCENARIOS[tab][goal].context,
  })

  it('reconhece o exemplo intacto da aba e objetivo atuais', () => {
    const d = example('story', 'flirt')
    expect(isUsingExample(d)).toBe(true)
    expect(toDemoRequest(d).source).toBe('example')
  })

  it('trata texto editado como entrada própria', () => {
    const d = { ...example('reply', 'continue'), text: 'Marina: oi' }
    expect(isUsingExample(d)).toBe(false)
    expect(toDemoRequest(d).source).toBe('own-text')
  })

  it('trata contexto editado como entrada própria', () => {
    expect(isUsingExample({ ...example('reply', 'continue'), context: 'outra coisa' })).toBe(false)
  })

  it('trata exemplo de outro objetivo como entrada própria', () => {
    expect(isUsingExample({ ...example('reply', 'continue'), goal: 'flirt' })).toBe(false)
  })

  it('print é sempre entrada própria', () => {
    const d = { ...example('reply', 'continue'), mode: 'image' as const }
    expect(isUsingExample(d)).toBe(false)
    expect(toDemoRequest(d).source).toBe('own-image')
  })
})
