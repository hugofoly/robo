import { describe, expect, it } from 'vitest'
import { A_DEFINIR, COMPANY, LEGAL_PAGES } from '../data/legal'
import { createStore } from './store'

describe('páginas legais', () => {
  it('três páginas com conteúdo', () => {
    expect(LEGAL_PAGES.map((p) => p.id)).toEqual(['privacy', 'terms', 'contact'])
    for (const p of LEGAL_PAGES) {
      expect(p.sections.length).toBeGreaterThan(0)
      for (const s of p.sections) expect(s.paragraphs.every((t) => t.trim().length > 0)).toBe(true)
    }
  })

  it('dados da empresa: valor real ou "a definir", nunca vazio', () => {
    for (const v of Object.values(COMPANY)) expect(v.trim().length).toBeGreaterThan(0)
    // A página de contato mostra todos os campos.
    const contact = JSON.stringify(LEGAL_PAGES.find((p) => p.id === 'contact'))
    for (const v of Object.values(COMPANY)) expect(contact).toContain(v)
    expect(A_DEFINIR).toBe('a definir')
  })

  it('privacidade descreve o funcionamento atual (nada enviado, nada guardado)', () => {
    const text = JSON.stringify(LEGAL_PAGES.find((p) => p.id === 'privacy'))
    expect(text).toContain('não são enviados a servidores')
    expect(text).toContain('apagadas ao recarregar')
    expect(text).toContain('Não usamos cookies')
  })

  it('abrir, trocar e fechar no store', () => {
    const s = createStore()
    expect(s.getState().legalPage).toBeNull()
    s.actions.openLegal('terms')
    expect(s.getState().legalPage).toBe('terms')
    s.actions.openLegal('contact')
    expect(s.getState().legalPage).toBe('contact')
    s.actions.closeLegal()
    expect(s.getState().legalPage).toBeNull()
  })
})
