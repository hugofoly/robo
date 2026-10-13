import { describe, expect, it } from 'vitest'
import { MATCH_EXAMPLE } from '../data/matchExample'
import { profileScore } from './profile'

const review = MATCH_EXAMPLE.content.profile!

describe('nota de força do perfil', () => {
  it('pesos somam 100 e notas ficam entre 0 e 100', () => {
    expect(review.dimensions.reduce((s, d) => s + d.weight, 0)).toBe(100)
    for (const d of review.dimensions) {
      for (const v of [d.now, d.after]) expect(v >= 0 && v <= 100).toBe(true)
      expect(d.after).toBeGreaterThanOrEqual(d.now)
    }
  })

  it('média ponderada do exemplo: 49% hoje, 85% com as sugestões', () => {
    expect(profileScore(review.dimensions, 'now')).toBe(49)
    expect(profileScore(review.dimensions, 'after')).toBe(85)
  })

  it('casos-limite', () => {
    expect(profileScore([], 'now')).toBe(0)
    expect(profileScore([{ id: 'a', label: 'A', weight: 1, now: 100, after: 100, note: '' }], 'now')).toBe(100)
  })

  it('cada foto do exemplo tem veredito e explicação', () => {
    expect(review.photos.length).toBeGreaterThan(0)
    for (const p of review.photos) {
      expect(['keep', 'move', 'replace']).toContain(p.verdict)
      expect(p.note.length).toBeGreaterThan(0)
    }
  })
})
