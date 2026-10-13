import type { ReactNode } from 'react'
import type { PhotoVerdict, ProfileReview as Review } from '../data/types'
import type { DemoSource } from '../lib/demo'
import { profileScore } from '../lib/profile'
import { useActions } from '../lib/StoreProvider'
import { CameraIcon, CheckIcon, MoveIcon, XIcon } from './Icons'

const VERDICTS: Record<PhotoVerdict, { label: string; icon: ReactNode }> = {
  keep: { label: 'Manter', icon: <CheckIcon size={14} /> },
  move: { label: 'Mover', icon: <MoveIcon /> },
  replace: { label: 'Trocar', icon: <XIcon size={14} /> },
}

interface Props {
  review: Review
  source: DemoSource
  photoCount: number
}

/**
 * Força do perfil (0–100) e revisão das fotos. Números e vereditos só aparecem para o exemplo
 * identificado; um perfil próprio nunca recebe nota inventada.
 */
export function ProfileReview({ review, source, photoCount }: Props) {
  if (source !== 'example') return <PendingScore photoCount={photoCount} />

  const now = profileScore(review.dimensions, 'now')
  const after = profileScore(review.dimensions, 'after')

  return (
    <>
      <section className="card score-card" aria-labelledby="score-title">
        <div className="score-head">
          <h3 id="score-title" className="card-title">
            Força do perfil
          </h3>
          <span className="tag">Perfil de exemplo</span>
        </div>
        <p className="score-hero">
          {now}
          <span className="score-unit">%</span>
        </p>
        <p className="score-delta">
          <strong>+{after - now} pontos</strong> com as sugestões, chegando a {after}%
        </p>

        <div className="meter-legend" aria-hidden="true">
          <span>
            <i className="swatch swatch-now" /> Hoje
          </span>
          <span>
            <i className="swatch swatch-after" /> Com as sugestões
          </span>
        </div>

        <ul className="meters">
          {review.dimensions.map((d) => (
            <li key={d.id} className="meter-row">
              <div className="meter-label">
                <span className="meter-name">
                  {d.label} <span className="meter-weight">peso {d.weight}%</span>
                </span>
                <span className="meter-values">
                  {d.now} → {d.after}
                </span>
              </div>
              <div
                className="meter"
                role="img"
                aria-label={`${d.label}: ${d.now} de 100 hoje, ${d.after} com as sugestões`}
              >
                <span className="meter-after" style={{ width: `${d.after}%` }} />
                <span className="meter-now" style={{ width: `${d.now}%` }} />
              </div>
              <p className="meter-note">{d.note}</p>
            </li>
          ))}
        </ul>

        <details className="score-method">
          <summary>Como a nota é calculada</summary>
          <p>
            Média ponderada de {review.dimensions.map((d) => `${d.label} (${d.weight}%)`).join(', ')}, de 0 a 100. Nesta
            demonstração a nota é de um perfil fictício, escrita à mão; a análise real ainda não está conectada.
          </p>
        </details>
      </section>

      <PhotoReview review={review} />
    </>
  )
}

function PhotoReview({ review }: { review: Review }) {
  const { setPhotoCategory, selectTab } = useActions()
  return (
    <section className="card photo-review" aria-labelledby="photo-review-title">
      <div className="score-head">
        <h3 id="photo-review-title" className="card-title">
          Fotos
        </h3>
        <span className="tag">Fotos fictícias</span>
      </div>
      <ul className="verdicts">
        {review.photos.map((p, i) => (
          <li key={p.description} className="verdict-row">
            <span className={`verdict verdict-${p.verdict}`}>
              {VERDICTS[p.verdict].icon}
              {VERDICTS[p.verdict].label}
            </span>
            <div className="verdict-text">
              <p className="verdict-desc">
                Foto {i + 1}: {p.description}
              </p>
              <p className="verdict-note">{p.note}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="photo-review-extra">
        <p className="extra-title">Está faltando</p>
        <ul>
          {review.missing.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
        <p className="extra-title">Ordem sugerida</p>
        <p>{review.order}</p>
      </div>
      <button
        type="button"
        className="btn-secondary with-icon"
        onClick={() => {
          setPhotoCategory('Foto principal')
          selectTab('photos')
        }}
      >
        <CameraIcon size={18} /> Ver prompts em Fotos de Impacto
      </button>
    </section>
  )
}

function PendingScore({ photoCount }: { photoCount: number }) {
  return (
    <section className="card score-card" aria-labelledby="score-title">
      <h3 id="score-title" className="card-title">
        Força do perfil
      </h3>
      <p className="score-hero is-pending" aria-label="Nota indisponível">
        –<span className="score-unit">%</span>
      </p>
      <p className="score-delta">
        A nota do seu perfil será calculada quando a análise real estiver conectada.
        {photoCount === 1 && ' Sua foto ficou só neste navegador e não foi analisada.'}
        {photoCount > 1 && ` Suas ${photoCount} fotos ficaram só neste navegador e não foram analisadas.`}
      </p>
    </section>
  )
}
