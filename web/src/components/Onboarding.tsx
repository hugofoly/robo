import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { TOUR_STEPS } from '../lib/onboarding'
import { useActions, useAppState } from '../lib/StoreProvider'
import { CameraIcon, HeartIcon, SparklesIcon } from './Icons'
import { AppIcon } from './Logo'

/** Onboarding de navegação: tela de boas-vindas e tour com destaque nos elementos reais da interface. */
export function Onboarding() {
  const { stage, step } = useAppState((s) => s.onboarding)
  if (stage === 'welcome') return <Welcome />
  if (stage === 'tour') return <Tour step={step} />
  if (stage === 'underage') return <Underage />
  return null
}

/** Mantém o foco dentro do diálogo (Tab / Shift+Tab) e fecha com Esc. */
function useDialogKeys(onEscape: () => void) {
  return (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onEscape()
      return
    }
    if (e.key !== 'Tab') return
    const focusables = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled])'))
    if (focusables.length === 0) return
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
}

const FEATURES = [
  { icon: <SparklesIcon size={24} />, title: 'Assistente', body: 'Respostas para conversas, para puxar assunto e para stories.' },
  { icon: <HeartIcon size={24} />, title: 'Robô de Match', body: 'Bio, fotos e a força do seu perfil, de 0 a 100%.' },
  { icon: <CameraIcon size={24} />, title: 'Fotos de Impacto', body: 'Prompts para criar fotos de perfil que chamam atenção.' },
]

/** Foca o título ao abrir e trava a rolagem da página por trás. */
function useSheetOpen() {
  const titleRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    // Foco no título: o leitor de tela anuncia a tela; Tab leva aos controles.
    titleRef.current?.focus()
    const previous = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = previous
    }
  }, [])
  return titleRef
}

function Welcome() {
  const { startTour, closeOnboarding, setAgeConfirmed, declareUnderage } = useActions()
  const ageConfirmed = useAppState((s) => s.ageConfirmed)
  // Quem já confirmou a idade (ex.: "Rever apresentação") não vê a caixa de novo.
  const [askAge] = useState(!ageConfirmed)
  const titleRef = useSheetOpen()
  const onKeyDown = useDialogKeys(closeOnboarding)

  return (
    <div className="onboarding-backdrop">
      <div className="welcome" role="dialog" aria-modal="true" aria-labelledby="welcome-title" onKeyDown={onKeyDown}>
        <div className="welcome-body">
          <AppIcon size={72} />
          <h2 id="welcome-title" ref={titleRef} tabIndex={-1}>
            Boas-vindas ao Robô de Date
          </h2>
          <p className="welcome-sub">A mensagem certa muda o jogo.</p>
          <ul className="welcome-features">
            {FEATURES.map((f) => (
              <li key={f.title}>
                <span className="welcome-icon" aria-hidden="true">
                  {f.icon}
                </span>
                <span>
                  <strong>{f.title}</strong>
                  <span className="welcome-feature-body">{f.body}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="welcome-note">Nesta versão, as respostas são exemplos de demonstração.</p>
        </div>
        {askAge && (
          <div className="age-gate">
            <label className="toggle-row consent-row">
              <input
                type="checkbox"
                checked={ageConfirmed}
                aria-describedby="age-hint"
                onChange={(e) => setAgeConfirmed(e.target.checked)}
              />
              <span>Tenho 18 anos ou mais.</span>
            </label>
            <p id="age-hint" className="age-hint">
              O Robô de Date é só para maiores de 18 anos.
            </p>
          </div>
        )}
        <div className="welcome-actions">
          <button type="button" className="btn-primary" onClick={startTour} disabled={!ageConfirmed}>
            Fazer o tour
          </button>
          <button type="button" className="btn-plain" onClick={closeOnboarding} disabled={!ageConfirmed}>
            Agora não
          </button>
          {askAge && (
            <button type="button" className="btn-plain btn-quiet" onClick={declareUnderage}>
              Tenho menos de 18 anos
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/** Bloqueio para quem disse ter menos de 18. Não há como fechar nesta sessão. */
function Underage() {
  const titleRef = useSheetOpen()
  return (
    <div className="onboarding-backdrop is-opaque">
      <div className="welcome" role="alertdialog" aria-modal="true" aria-labelledby="underage-title" aria-describedby="underage-body">
        <div className="welcome-body">
          <AppIcon size={72} />
          <h2 id="underage-title" ref={titleRef} tabIndex={-1}>
            Volte quando tiver 18 anos
          </h2>
          <p id="underage-body" className="welcome-sub">
            O Robô de Date é só para maiores de 18 anos, porque fala de encontros e de temas adultos. Nada do que você
            fez aqui foi guardado.
          </p>
        </div>
      </div>
    </div>
  )
}

interface Box {
  top: number
  left: number
  width: number
  height: number
  radius: string
}

const PAD = 6
const GAP = 12
const MARGIN = 16

function Tour({ step }: { step: number }) {
  const { setTourStep, closeOnboarding } = useActions()
  const current = TOUR_STEPS[step]
  const last = step === TOUR_STEPS.length - 1
  const [box, setBox] = useState<Box | null>(null)
  const [cardPos, setCardPos] = useState<{ top: number; left: number } | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const onKeyDown = useDialogKeys(closeOnboarding)

  const measure = useCallback(() => {
    const el = document.querySelector<HTMLElement>(current.target)
    const card = cardRef.current
    if (!el || !card) {
      setBox(null)
      return
    }
    const r = el.getBoundingClientRect()
    const radius = getComputedStyle(el).borderRadius
    const b = { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2, radius }
    setBox({ ...b, radius: radius === '0px' ? '14px' : `calc(${radius} + ${PAD}px)` })

    // Balão abaixo do elemento se couber; senão, acima. Sempre dentro da tela.
    const vw = document.documentElement.clientWidth
    const vh = window.innerHeight
    const ch = card.offsetHeight
    const cw = card.offsetWidth
    const below = b.top + b.height + GAP
    const top = below + ch <= vh - MARGIN ? below : Math.max(MARGIN, b.top - GAP - ch)
    const left = Math.min(Math.max(MARGIN, r.left + r.width / 2 - cw / 2), vw - cw - MARGIN)
    setCardPos({ top, left })
  }, [current.target])

  // Rola até o elemento se necessário e mede antes de pintar.
  useLayoutEffect(() => {
    const el = document.querySelector<HTMLElement>(current.target)
    if (el && getComputedStyle(el).position !== 'fixed' && !el.closest('.app-nav')) {
      const r = el.getBoundingClientRect()
      if (r.top < 0 || r.bottom > window.innerHeight) el.scrollIntoView({ block: 'center' })
    }
    measure()
  }, [measure, current.target])

  useEffect(() => {
    titleRef.current?.focus()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [measure, step])

  return (
    <div className="tour-layer">
      {/* Bloqueia cliques na página; o "furo" do destaque é só visual. */}
      <div className="tour-blocker" aria-hidden="true" />
      {box && (
        <div
          className="tour-spotlight"
          aria-hidden="true"
          style={{ top: box.top, left: box.left, width: box.width, height: box.height, borderRadius: box.radius }}
        />
      )}
      <div
        ref={cardRef}
        className="tour-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        onKeyDown={onKeyDown}
        style={cardPos ? { top: cardPos.top, left: cardPos.left } : { visibility: 'hidden' }}
      >
        <p className="tour-progress">
          Passo {step + 1} de {TOUR_STEPS.length}
        </p>
        <h2 id="tour-title" ref={titleRef} tabIndex={-1}>
          {current.title}
        </h2>
        <p id="tour-body">{current.body}</p>
        <div className="tour-dots" aria-hidden="true">
          {TOUR_STEPS.map((s, i) => (
            <span key={s.title} className={i === step ? 'is-active' : undefined} />
          ))}
        </div>
        <div className="tour-actions">
          <button type="button" className="btn-plain" onClick={closeOnboarding}>
            Pular
          </button>
          <span className="tour-nav">
            {step > 0 && (
              <button type="button" className="btn-secondary" onClick={() => setTourStep(step - 1)}>
                Voltar
              </button>
            )}
            <button
              type="button"
              className="btn-save"
              onClick={() => (last ? closeOnboarding() : setTourStep(step + 1))}
            >
              {last ? 'Começar' : 'Próximo'}
            </button>
          </span>
        </div>
      </div>
    </div>
  )
}
