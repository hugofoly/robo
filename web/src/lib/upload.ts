export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024

/** Valor para o atributo `accept` do input de arquivo. */
export const IMAGE_ACCEPT = ACCEPTED_IMAGE_TYPES.join(',')

type FileLike = Pick<File, 'name' | 'size' | 'type'>

/** Retorna a mensagem de erro para um arquivo inválido, ou `null` se ele for aceito. */
export function validateImage(file: FileLike): string | null {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return 'Formato não suportado. Envie um print em PNG, JPEG ou WebP.'
  }
  if (file.size === 0) {
    return 'O arquivo está vazio. Tente outro print.'
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `O arquivo tem ${formatBytes(file.size)}. O limite é 10 MB.`
  }
  return null
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`
}
