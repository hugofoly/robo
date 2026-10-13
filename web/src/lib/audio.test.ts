import { describe, expect, it } from 'vitest'
import { AUDIO_EXAMPLE, MAX_AUDIO_BYTES, formatDuration, validateAudio } from './audio'
import { INITIAL_DRAFT, hasValidInput, type AssistantDraft } from './assistant'
import { getScenario, isUsingExample, toDemoRequest } from './demo'

const f = (name: string, type: string, size = 1000) => ({ name, type, size })

describe('validateAudio', () => {
  it.each([
    ['nota.mp3', 'audio/mpeg'],
    ['nota.m4a', 'audio/x-m4a'],
    ['nota.m4a', ''],
    ['PTT-2024.opus', ''],
    ['nota.ogg', 'audio/ogg'],
    ['nota.wav', 'audio/wav'],
    ['gravacao.webm', 'audio/webm'],
  ])('aceita %s (%s)', (name, type) => {
    expect(validateAudio(f(name, type))).toBeNull()
  })

  it.each([
    ['foto.png', 'image/png'],
    ['doc.pdf', 'application/pdf'],
    ['video.mov', 'video/quicktime'],
    ['semextensao', ''],
    ['falso.mp3', 'image/png'],
  ])('rejeita %s (%s)', (name, type) => {
    expect(validateAudio(f(name, type))).toMatch(/Formato não suportado/)
  })

  it('limite de 10 MB', () => {
    expect(validateAudio(f('a.mp3', 'audio/mpeg', MAX_AUDIO_BYTES))).toBeNull()
    expect(validateAudio(f('a.mp3', 'audio/mpeg', MAX_AUDIO_BYTES + 1))).toMatch(/10 MB/)
    expect(validateAudio(f('a.mp3', 'audio/mpeg', 0))).toMatch(/vazio/)
  })

  it('formata duração', () => {
    expect(formatDuration(0)).toBe('0:00')
    expect(formatDuration(65_400)).toBe('1:05')
    expect(formatDuration(180_000)).toBe('3:00')
  })
})

describe('áudio no rascunho', () => {
  const ctx = getScenario('reply', 'continue').context
  const exampleDraft: AssistantDraft = {
    ...INITIAL_DRAFT,
    mode: 'audio',
    tab: 'reply',
    goal: 'continue',
    context: ctx,
    audio: { kind: 'example', transcript: AUDIO_EXAMPLE.transcript },
  }
  const ownDraft: AssistantDraft = {
    ...INITIAL_DRAFT,
    mode: 'audio',
    audio: { kind: 'own', origin: 'recording', blob: new Blob(['x']), url: 'blob:x', name: 'Gravação', durationMs: 1000 },
  }

  it('áudio próprio é válido mas nunca é exemplo', () => {
    expect(hasValidInput(ownDraft)).toBe(true)
    expect(isUsingExample(ownDraft)).toBe(false)
    expect(toDemoRequest(ownDraft).source).toBe('own-audio')
  })

  it('exemplo identificado intacto conta como exemplo', () => {
    expect(isUsingExample(exampleDraft)).toBe(true)
    expect(toDemoRequest(exampleDraft).source).toBe('example')
  })

  it('transcrição editada ou fora do cenário não é exemplo', () => {
    const edited = { ...exampleDraft, audio: { kind: 'example' as const, transcript: 'outra coisa' } }
    expect(toDemoRequest(edited).source).toBe('own-transcript')
    expect(toDemoRequest({ ...exampleDraft, goal: 'flirt' }).source).toBe('own-transcript')
    expect(toDemoRequest({ ...exampleDraft, tab: 'story' }).source).toBe('own-transcript')
  })

  it('sem áudio ou transcrição vazia não habilita gerar', () => {
    expect(hasValidInput({ ...INITIAL_DRAFT, mode: 'audio' })).toBe(false)
    expect(hasValidInput({ ...exampleDraft, audio: { kind: 'example', transcript: '  ' } })).toBe(false)
  })
})
