/**
 * Copia texto para a área de transferência. Tenta a API assíncrona e, se ela não existir
 * ou for negada, o `execCommand` legado. Retorna `false` se nenhum dos dois funcionar,
 * para a interface oferecer seleção manual.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Permissão negada ou contexto inseguro: tenta o caminho legado.
  }
  return legacyCopy(text)
}

function legacyCopy(text: string): boolean {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  const previousFocus = document.activeElement as HTMLElement | null
  textarea.select()
  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }
  textarea.remove()
  previousFocus?.focus()
  return ok
}

/** Seleciona o conteúdo de um elemento para o usuário copiar manualmente. */
export function selectElementText(el: HTMLElement) {
  const selection = window.getSelection()
  if (!selection) return
  const range = document.createRange()
  range.selectNodeContents(el)
  selection.removeAllRanges()
  selection.addRange(range)
}
