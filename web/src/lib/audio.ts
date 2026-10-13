export const MAX_AUDIO_BYTES = 10 * 1024 * 1024
export const MAX_RECORDING_MS = 3 * 60 * 1000

const AUDIO_EXTENSIONS = ['mp3', 'm4a', 'aac', 'ogg', 'oga', 'opus', 'wav', 'webm', 'mp4']
const AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/x-m4a',
  'audio/m4a',
  'audio/aac',
  'audio/ogg',
  'audio/opus',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/webm',
]

/** Valor do atributo `accept`. Inclui extensões porque alguns sistemas não informam o MIME (ex.: .opus do WhatsApp). */
export const AUDIO_ACCEPT = [...AUDIO_TYPES, ...AUDIO_EXTENSIONS.map((e) => `.${e}`)].join(',')

type FileLike = Pick<File, 'name' | 'size' | 'type'>

export function validateAudio(file: FileLike): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  const typeOk = AUDIO_TYPES.includes(file.type.toLowerCase())
  const extOk = AUDIO_EXTENSIONS.includes(ext) && (file.type === '' || file.type.startsWith('audio/') || file.type === 'video/mp4' || file.type === 'video/webm' || file.type === 'application/ogg')
  if (!typeOk && !extOk) {
    return 'Formato não suportado. Envie um áudio MP3, M4A, OGG, OPUS, WAV ou WEBM.'
  }
  if (file.size === 0) return 'O arquivo de áudio está vazio.'
  if (file.size > MAX_AUDIO_BYTES) return 'O áudio passa de 10 MB. Envie um arquivo menor ou grave até 3 minutos.'
  return null
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

export { AUDIO_EXAMPLE } from '../data/audioExample'

export type MicError = 'denied' | 'no-device' | 'unavailable' | 'failed'

export const MIC_ERROR_MESSAGES: Record<MicError, string> = {
  denied: 'O acesso ao microfone foi negado.',
  'no-device': 'Nenhum microfone foi encontrado neste aparelho.',
  unavailable: 'Este navegador não permite gravar áudio aqui.',
  failed: 'Não foi possível iniciar a gravação.',
}
