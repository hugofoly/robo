import type { CopyState } from '../lib/useCopy'
import { CheckIcon, CopyIcon } from './Icons'

export function CopyButton({ state, onClick, describedBy }: { state: CopyState; onClick: () => void; describedBy: string }) {
  const copied = state === 'copied'
  return (
    <button type="button" className={`btn-copy${copied ? ' is-copied' : ''}`} onClick={onClick} aria-describedby={describedBy}>
      {copied ? <CheckIcon /> : <CopyIcon />}
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  )
}
