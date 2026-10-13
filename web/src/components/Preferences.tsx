import { DETAIL_OPTIONS, TONE_PREF_OPTIONS, type Detail } from '../lib/preferences'
import { useActions, useAppState } from '../lib/StoreProvider'
import type { Tone } from '../lib/demo'
import { SegmentedControl } from './SegmentedControl'

export function PreferencesCard() {
  const prefs = useAppState((s) => s.preferences)
  const { setPreferences } = useActions()

  return (
    <section className="card prefs" aria-labelledby="prefs-title">
      <h3 id="prefs-title" className="card-title">
        Preferências <span className="optional">opcionais</span>
      </h3>
      <div className="field">
        <span id="pref-tone-label" className="field-label">
          Tom padrão
        </span>
        <SegmentedControl
          kind="radio"
          size="small"
          idPrefix="pref-tone"
          label="Tom padrão"
          options={TONE_PREF_OPTIONS}
          value={prefs.tone ?? 'none'}
          onChange={(v) => setPreferences({ tone: v === 'none' ? null : (v as Tone) })}
        />
        <p className="field-help">O tom escolhido aparece primeiro nos resultados, marcado como “Seu tom”.</p>
      </div>
      <div className="field">
        <span id="pref-detail-label" className="field-label">
          Explicação
        </span>
        <SegmentedControl
          kind="radio"
          size="small"
          idPrefix="pref-detail"
          label="Explicação"
          options={DETAIL_OPTIONS}
          value={prefs.detail ?? 'none'}
          onChange={(v) => setPreferences({ detail: v === 'none' ? null : (v as Detail) })}
        />
        <p className="field-help">
          Curta mostra só o essencial. Detalhada acrescenta o próximo passo à leitura e às explicações.
        </p>
      </div>
      <p className="temp-notice">Valem só nesta sessão: recarregar a página volta ao padrão.</p>
    </section>
  )
}
