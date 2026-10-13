import { describe, expect, it } from 'vitest'
import { PHOTO_CATEGORIES, PHOTO_PROMPTS } from '../data/photoPrompts'
import { answerFor, matchShortcut, shortcutsFor } from './followup'
import { getModeContent } from './modes'

describe('Fotos de Impacto', () => {
  it('prompts com id único, categoria válida e texto', () => {
    const ids = PHOTO_PROMPTS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const p of PHOTO_PROMPTS) {
      expect(PHOTO_CATEGORIES).toContain(p.category)
      expect(p.title && p.description && p.prompt).toBeTruthy()
    }
    expect(new Set(PHOTO_PROMPTS.map((p) => p.prompt)).size).toBe(PHOTO_PROMPTS.length)
  })
})

describe('atalhos sem "Ela respondeu isso." (Robô de Match)', () => {
  const content = getModeContent('match')
  it('o atalho não aparece e, se digitado, não finge resposta', () => {
    expect(shortcutsFor(content).map((s) => s.id)).toEqual(['why', 'next'])
    expect(answerFor(content, matchShortcut('Ela respondeu isso.'))).toEqual({ kind: 'not-connected' })
  })
})
