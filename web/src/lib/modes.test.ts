import { describe, expect, it } from 'vitest'
import { GOALS, TABS } from './assistant'
import { ADJUSTMENTS, TONES, getScenario } from './demo'
import {
  MODES,
  POST_DATE_PATHS,
  allModeContents,
  emptyModeDraft,
  getMode,
  getModeContent,
  getModeExampleValues,
  isModeValid,
  toModeRequest,
} from './modes'

const modeContents = allModeContents()
const allTexts = (c: (typeof modeContents)[number]['content']) =>
  TONES.flatMap((t) => [c.cards[t.id].text, ...ADJUSTMENTS.map((a) => c.cards[t.id].variants[a.id])])

describe('modos especiais', () => {
  it('tem os quatro modos', () => {
    expect(MODES.map((m) => m.title)).toEqual(['Date Rápido', 'Pós-Date', 'Protocolo Nudes', 'Sexo Express'])
  })

  it('Pós-Date inclui os três caminhos com exemplos próprios', () => {
    expect(POST_DATE_PATHS.map((p) => p.label)).toEqual(['Casual', 'Buscar namoro', 'Tentar segundo encontro'])
    const summaries = POST_DATE_PATHS.map((p) => getModeContent('post-date', p.id).summary)
    expect(new Set(summaries).size).toBe(3)
    const values = POST_DATE_PATHS.map((p) => getModeExampleValues('post-date', p.id).date)
    expect(new Set(values).size).toBe(3)
  })

  it.each(modeContents)('$key: 3 cards distintos, 5 variantes distintas e explicações', ({ content }) => {
    for (const t of TONES) {
      const c = content.cards[t.id]
      const versions = [c.text, ...ADJUSTMENTS.map((a) => c.variants[a.id])]
      expect(new Set(versions.map((v) => v.trim())).size).toBe(6)
      expect(c.why.intent && c.why.next).toBeTruthy()
    }
    const label = TONES.find((t) => t.id === content.recommended)!.label
    expect(content.followUps.why).toContain(`(${label})`)
  })

  it('exemplos dos modos são diferentes entre si e dos cenários do Assistente', () => {
    const assistant = TABS.flatMap((t) => GOALS.map((g) => getScenario(t.id, g.id)))
    const all = [...modeContents.map((m) => m.content), ...assistant]
    const texts = all.flatMap(allTexts)
    expect(new Set(texts).size).toBe(texts.length)
    const summaries = all.map((c) => c.summary)
    expect(new Set(summaries).size).toBe(summaries.length)
  })

  it('Nudes e Express exigem maioridade e não têm campos de imagem', () => {
    for (const id of ['nudes', 'express'] as const) {
      const def = getMode(id)
      expect(def.adultConfirm).toBe(true)
      expect(def.fields.every((f) => f.kind === 'text' || f.kind === 'textarea')).toBe(true)
      const values = getModeExampleValues(id)
      expect(isModeValid(def, { ...emptyModeDraft(), values })).toBe(false)
      expect(isModeValid(def, { ...emptyModeDraft(), values, adult: true })).toBe(true)
    }
  })

  it('Date Rápido exige contexto e disponibilidade', () => {
    const def = getMode('quick-date')
    expect(isModeValid(def, { ...emptyModeDraft(), values: { context: 'x' } })).toBe(false)
    expect(isModeValid(def, { ...emptyModeDraft(), values: { context: 'x', availability: 'sábado' } })).toBe(true)
  })

  it('toModeRequest: exemplo intacto vs entrada própria', () => {
    const def = getMode('post-date')
    const draft = { ...emptyModeDraft(), path: 'relationship' as const, values: getModeExampleValues('post-date', 'relationship') }
    const req = toModeRequest(def, draft)
    expect(req.source).toBe('example')
    expect(req.label).toBe('Pós-Date · Buscar namoro')
    expect(req.content.summary).toContain('Helena')
    // Exemplo de outro caminho não conta como exemplo do caminho atual.
    expect(toModeRequest(def, { ...draft, path: 'casual' }).source).toBe('own-text')
    expect(toModeRequest(def, { ...draft, values: { date: 'saí com a Ana' } }).source).toBe('own-text')
  })
})
