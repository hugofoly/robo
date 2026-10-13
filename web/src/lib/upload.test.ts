import { describe, expect, it } from 'vitest'
import { MAX_IMAGE_BYTES, formatBytes, validateImage } from './upload'

const file = (type: string, size = 1000) => ({ name: 'print', type, size })

describe('validateImage', () => {
  it.each(['image/png', 'image/jpeg', 'image/webp'])('aceita %s', (type) => {
    expect(validateImage(file(type))).toBeNull()
  })

  it.each(['image/gif', 'image/heic', 'application/pdf', ''])('rejeita tipo "%s"', (type) => {
    expect(validateImage(file(type))).toMatch(/Formato não suportado/)
  })

  it('aceita exatamente 10 MB', () => {
    expect(validateImage(file('image/png', MAX_IMAGE_BYTES))).toBeNull()
  })

  it('rejeita acima de 10 MB', () => {
    expect(validateImage(file('image/png', MAX_IMAGE_BYTES + 1))).toMatch(/limite é 10 MB/)
  })

  it('rejeita arquivo vazio', () => {
    expect(validateImage(file('image/png', 0))).toMatch(/vazio/)
  })
})

describe('formatBytes', () => {
  it('formata em pt-BR', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(2048)).toBe('2 KB')
    expect(formatBytes(12.5 * 1024 * 1024)).toBe('12,5 MB')
  })
})
