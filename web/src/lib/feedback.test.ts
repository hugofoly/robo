import { describe, expect, it } from 'vitest'
import { nextFeedback } from './feedback'

describe('nextFeedback', () => {
  it('marca, troca e desmarca o veredito', () => {
    const use = nextFeedback(null, { verdict: 'use' })
    expect(use).toEqual({ verdict: 'use', reasons: [] })
    const skip = nextFeedback(use, { verdict: 'skip' })
    expect(skip).toEqual({ verdict: 'skip', reasons: [] })
    expect(nextFeedback(skip, { verdict: 'skip' })).toBeNull()
  })

  it('alterna motivos só quando "Não usaria"', () => {
    let f = nextFeedback(null, { verdict: 'skip' })
    f = nextFeedback(f, { toggleReason: 'generic' })
    f = nextFeedback(f, { toggleReason: 'over' })
    expect(f?.reasons).toEqual(['generic', 'over'])
    f = nextFeedback(f, { toggleReason: 'generic' })
    expect(f?.reasons).toEqual(['over'])
    expect(nextFeedback({ verdict: 'use', reasons: [] }, { toggleReason: 'generic' })).toEqual({ verdict: 'use', reasons: [] })
  })

  it('trocar para "Usaria" limpa os motivos', () => {
    expect(nextFeedback({ verdict: 'skip', reasons: ['not-me'] }, { verdict: 'use' })).toEqual({ verdict: 'use', reasons: [] })
  })
})
