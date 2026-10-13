import { useRef, type SyntheticEvent } from 'react'

/** Tempo após uma troca de tela em que cliques são ignorados (segundo clique de um duplo clique). */
export const GUARD_MS = 450

/**
 * Evita que o segundo clique de um duplo clique caia no botão que acabou de aparecer no mesmo lugar
 * (ex.: "Remover" → "Gravar", que ligaria o microfone sem intenção). `stateKey` muda quando a tela troca.
 */
export function useClickGuard(stateKey: unknown) {
  // Só arma quando a tela troca no lugar; montar o componente (ex.: escolher "Áudio") não bloqueia cliques.
  const since = useRef(Number.NEGATIVE_INFINITY)
  const last = useRef(stateKey)
  if (last.current !== stateKey) {
    last.current = stateKey
    since.current = performance.now()
  }

  return function guard<E extends SyntheticEvent>(fn: (e: E) => void) {
    return (e: E) => {
      if (performance.now() - since.current < GUARD_MS) {
        e.preventDefault()
        return
      }
      fn(e)
    }
  }
}
