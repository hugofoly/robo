import { useRef, type KeyboardEvent, type ReactNode } from 'react'

interface Option<T extends string> {
  id: T
  label: ReactNode
}

interface Props<T extends string> {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  /** `tabs` para alternar painéis; `radio` para escolher um valor. */
  kind: 'tabs' | 'radio'
  idPrefix: string
  size?: 'regular' | 'small'
}

export function SegmentedControl<T extends string>({ options, value, onChange, label, kind, idPrefix, size = 'regular' }: Props<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const index = options.findIndex((o) => o.id === value)

  function onKeyDown(e: KeyboardEvent) {
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    const target =
      e.key === 'Home' ? 0 : e.key === 'End' ? options.length - 1 : delta ? (index + delta + options.length) % options.length : -1
    if (target < 0) return
    e.preventDefault()
    onChange(options[target].id)
    refs.current[target]?.focus()
  }

  const isTabs = kind === 'tabs'
  return (
    <div
      className={`segmented segmented-${size}`}
      role={isTabs ? 'tablist' : 'radiogroup'}
      aria-label={label}
      onKeyDown={onKeyDown}
      style={{ ['--count' as string]: options.length, ['--index' as string]: index }}
    >
      <span className="segmented-thumb" aria-hidden="true" />
      {options.map((o, i) => {
        const selected = o.id === value
        return (
          <button
            key={o.id}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            id={`${idPrefix}-${o.id}`}
            role={isTabs ? 'tab' : 'radio'}
            aria-selected={isTabs ? selected : undefined}
            aria-checked={isTabs ? undefined : selected}
            aria-controls={isTabs ? `${idPrefix}-panel` : undefined}
            tabIndex={selected ? 0 : -1}
            className="segment"
            onClick={() => onChange(o.id)}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
