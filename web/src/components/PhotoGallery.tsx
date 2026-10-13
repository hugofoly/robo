import { useRef } from 'react'
import { PHOTO_CATEGORIES, PHOTO_PROMPTS, type PhotoPrompt } from '../data/photoPrompts'
import { useActions, useAppState } from '../lib/StoreProvider'
import { COPY_FALLBACK_MESSAGE, useCopy } from '../lib/useCopy'
import { CopyButton } from './CopyButton'
import { CameraIcon } from './Icons'

export function PhotoGallery({ onToast }: { onToast: (message: string) => void }) {
  const category = useAppState((s) => s.photoCategory)
  const { setPhotoCategory } = useActions()
  // Só categorias que têm prompts aparecem no filtro.
  const categories = PHOTO_CATEGORIES.filter((c) => PHOTO_PROMPTS.some((p) => p.category === c))
  const visible = category === 'all' ? PHOTO_PROMPTS : PHOTO_PROMPTS.filter((p) => p.category === category)
  const hasExamples = PHOTO_PROMPTS.some((p) => p.example)

  return (
    <section className="gallery" aria-labelledby="gallery-title">
      <div className="modes-head">
        <h2 id="gallery-title">Fotos de Impacto</h2>
        <span className="badge">Beta</span>
      </div>
      <p className="panel-intro">
        Prompts para criar fotos de perfil no gerador de imagens que você já usa, como ChatGPT ou Gemini. O Robô de Date
        não gera nem recebe fotos aqui.
      </p>

      {hasExamples && (
        <p className="demo-notice">Prompts de exemplo: a galeria oficial será adicionada em breve.</p>
      )}

      <ol className="how-to card" aria-label="Como usar">
        <li>Copie um prompt.</li>
        <li>No seu gerador de imagens, anexe uma foto sua recente e nítida.</li>
        <li>Cole o prompt e gere. Use só resultados que pareçam com você hoje.</li>
      </ol>

      <fieldset className="gallery-filter">
        <legend className="visually-hidden">Categoria</legend>
        <div className="chips">
          {['all', ...categories].map((c) => (
            <label key={c} className="chip">
              <input
                type="radio"
                name="photo-category"
                value={c}
                checked={category === c}
                onChange={() => setPhotoCategory(c)}
              />
              <span>{c === 'all' ? 'Todas' : c}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {visible.length === 0 ? (
        <p className="search-empty">Nenhum prompt nesta categoria ainda.</p>
      ) : (
        <ul className="gallery-grid" aria-label="Prompts">
          {visible.map((p) => (
            <PromptCard key={p.id} prompt={p} onCopied={() => onToast('Prompt copiado.')} />
          ))}
        </ul>
      )}
    </section>
  )
}

function PromptCard({ prompt: p, onCopied }: { prompt: PhotoPrompt; onCopied: () => void }) {
  const textRef = useRef<HTMLParagraphElement>(null)
  const { state, copy } = useCopy(textRef, onCopied)
  const textId = `prompt-${p.id}`

  return (
    <li className="prompt-card card">
      <div className="prompt-visual" aria-hidden={p.image ? undefined : true}>
        {p.image ? (
          <img src={p.image} alt={`Exemplo de foto: ${p.title}`} loading="lazy" />
        ) : (
          <span className="prompt-placeholder">
            <CameraIcon size={28} />
            <span>{p.category}</span>
          </span>
        )}
      </div>
      <div className="prompt-body">
        <div className="prompt-head">
          <h3 className="prompt-title">{p.title}</h3>
          {p.example && <span className="tag">Exemplo</span>}
        </div>
        <p className="prompt-desc">{p.description}</p>
        <p ref={textRef} id={textId} className="prompt-text">
          {p.prompt}
        </p>
        <div className="suggestion-foot">
          <CopyButton state={state} onClick={copy} describedBy={textId} />
        </div>
        <p className="copy-fallback" role="alert">
          {state === 'failed' && COPY_FALLBACK_MESSAGE}
        </p>
      </div>
    </li>
  )
}
