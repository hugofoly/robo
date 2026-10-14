import { useEffect, useRef, type KeyboardEvent } from 'react'
import { LEGAL_DRAFT_NOTICE, LEGAL_PAGES, LEGAL_UPDATED_AT, getLegalPage, type LegalPageId } from '../data/legal'
import { useActions, useAppState } from '../lib/StoreProvider'

/** Privacidade, Termos e Contato numa folha por cima do app (abre também a partir das boas-vindas). */
export function LegalSheet() {
  const id = useAppState((s) => s.legalPage)
  if (!id) return null
  return <Sheet id={id} />
}

function Sheet({ id }: { id: LegalPageId }) {
  const { openLegal, closeLegal } = useActions()
  const page = getLegalPage(id)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  // Ao fechar, o foco volta para o link que abriu a folha.
  const opener = useRef<HTMLElement | null>(null)

  useEffect(() => {
    opener.current = document.activeElement as HTMLElement | null
    const previous = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = previous
      // Só depois que o app (ou as boas-vindas) deixa de estar inerte o foco pode voltar.
      const back = opener.current
      requestAnimationFrame(() => back?.isConnected && back.focus())
    }
  }, [])

  useEffect(() => {
    titleRef.current?.focus()
    scrollRef.current?.scrollTo({ top: 0 })
  }, [id])

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      closeLegal()
      return
    }
    if (e.key !== 'Tab') return
    const focusables = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex="0"]'))
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return (
    <div className="onboarding-backdrop legal-backdrop">
      <div className="legal-sheet" role="dialog" aria-modal="true" aria-labelledby="legal-title" onKeyDown={onKeyDown}>
        <div className="legal-top">
          <nav className="legal-switch" aria-label="Documentos">
            {LEGAL_PAGES.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-current={p.id === id ? 'page' : undefined}
                onClick={() => openLegal(p.id)}
              >
                {p.short}
              </button>
            ))}
          </nav>
          <button type="button" className="btn-plain legal-close" onClick={closeLegal}>
            Fechar
          </button>
        </div>
        {/* Rolável pelo teclado (setas/espaço) mesmo sem links no texto. */}
        <div className="legal-scroll" ref={scrollRef} tabIndex={0} role="region" aria-labelledby="legal-title">
          <h2 id="legal-title" ref={titleRef} tabIndex={-1}>
            {page.title}
          </h2>
          <p className="legal-draft" role="note">
            {LEGAL_DRAFT_NOTICE} Atualizada em {LEGAL_UPDATED_AT}.
          </p>
          {page.sections.map((s) => (
            <section key={s.title} className="legal-section">
              <h3>{s.title}</h3>
              {s.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Links para as páginas legais (boas-vindas, rodapé e Minhas conversas). */
export function LegalLinks({ className }: { className?: string }) {
  const { openLegal } = useActions()
  return (
    <span className={className ? `legal-links ${className}` : 'legal-links'}>
      {LEGAL_PAGES.map((p) => (
        <button key={p.id} type="button" className="link-button" onClick={() => openLegal(p.id)}>
          {p.short}
        </button>
      ))}
    </span>
  )
}
