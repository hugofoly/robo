import { useRef, useState } from 'react'
import type { AudioInput as AudioValue } from '../lib/assistant'
import { AUDIO_ACCEPT, AUDIO_EXAMPLE, MAX_AUDIO_BYTES, MAX_RECORDING_MS, MIC_ERROR_MESSAGES, formatDuration, validateAudio } from '../lib/audio'
import { formatBytes } from '../lib/upload'
import { useRecorder } from '../lib/useRecorder'
import { AudioPlayer } from './AudioPlayer'
import { AlertIcon, LockIcon, MicIcon, StopIcon, WaveIcon } from './Icons'

interface Props {
  audio: AudioValue | null
  hint: string
  /** Substitui o áudio atual (o pai revoga a URL antiga). */
  onChange: (audio: AudioValue | null) => void
  onUseText: () => void
}

export function AudioInput({ audio, hint, onChange, onUseText }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const recorder = useRecorder({
    onComplete(blob, durationMs, reachedLimit) {
      if (blob.size > MAX_AUDIO_BYTES) {
        setError(`A gravação ficou com ${formatBytes(blob.size)} e passa do limite de 10 MB.`)
        return
      }
      onChange({ kind: 'own', origin: 'recording', blob, url: URL.createObjectURL(blob), name: 'Gravação de áudio', durationMs })
      setNotice(reachedLimit ? 'Limite de 3 minutos atingido: a gravação foi finalizada.' : null)
    },
  })

  const { state } = recorder
  const busy = state.status === 'recording' || state.status === 'requesting'

  function startRecording() {
    setError(null)
    setNotice(null)
    recorder.start()
  }

  function pickFile(file: File) {
    const err = validateAudio(file)
    setError(err)
    setNotice(null)
    if (err) return
    recorder.clearError()
    onChange({ kind: 'own', origin: 'file', blob: file, url: URL.createObjectURL(file), name: file.name, durationMs: null })
  }

  const fileInput = (
    <input
      ref={fileRef}
      id="audio-input"
      type="file"
      accept={AUDIO_ACCEPT}
      className="visually-hidden"
      tabIndex={-1}
      aria-hidden="true"
      onChange={(e) => {
        const file = e.target.files?.[0]
        if (file) pickFile(file)
        e.target.value = ''
      }}
    />
  )

  // ----- Exemplo identificado: transcrição fictícia, sem áudio real -----
  if (audio?.kind === 'example') {
    const edited = audio.transcript.trim() !== AUDIO_EXAMPLE.transcript
    return (
      <div className="audio-input">
        <div className="audio-example">
          <div className="audio-example-head">
            <span className="tag">Exemplo identificado</span>
            <span className="audio-example-title">Áudio fictício da {AUDIO_EXAMPLE.who}</span>
          </div>
          <p className="field-help">
            Não existe áudio aqui. É a transcrição inventada de um áudio de exemplo, para você testar a interface. Ela
            não tem relação com nenhum áudio gravado ou enviado.
          </p>
          <label htmlFor="demo-transcript" className="field-label">
            Transcrição demonstrativa <span className="optional">editável</span>
          </label>
          <textarea
            id="demo-transcript"
            rows={4}
            value={audio.transcript}
            onChange={(e) => onChange({ kind: 'example', transcript: e.target.value })}
          />
          {edited && <p className="field-help">Editada: ao gerar, ela deixa de contar como exemplo e não é analisada.</p>}
          <button type="button" className="btn-secondary destructive" onClick={() => onChange(null)}>
            Remover exemplo
          </button>
        </div>
      </div>
    )
  }

  // ----- Áudio próprio: player + transcrição ainda não conectada -----
  if (audio?.kind === 'own') {
    return (
      <div className="audio-input">
        {fileInput}
        <AudioPlayer url={audio.url} name={audio.name} durationMs={audio.durationMs} />
        <div className="preview-actions">
          <button type="button" className="btn-secondary" onClick={() => fileRef.current?.click()}>
            Trocar arquivo
          </button>
          <button
            type="button"
            className="btn-secondary destructive"
            onClick={() => {
              setNotice(null)
              onChange(null)
            }}
          >
            Remover
          </button>
        </div>
        {notice && <p className="field-help" role="status">{notice}</p>}
        <div className="transcript-pending">
          <WaveIcon />
          <div>
            <p className="transcript-pending-title">Transcrição</p>
            <p>A transcrição será conectada depois. Por enquanto, este áudio não é transcrito nem analisado.</p>
          </div>
        </div>
        <ErrorLine error={error} />
      </div>
    )
  }

  // ----- Gravando / pedindo permissão -----
  if (busy) {
    const elapsed = state.status === 'recording' ? state.elapsedMs : 0
    return (
      <div className="audio-input">
        <div className="recording" role="group" aria-label="Gravação em andamento">
          <div className="recording-status">
            <span className={`rec-dot${state.status === 'recording' ? ' is-live' : ''}`} aria-hidden="true" />
            <span>{state.status === 'requesting' ? 'Aguardando permissão do microfone…' : 'Gravando'}</span>
            <span className="rec-timer" role="timer" aria-live="off">
              {formatDuration(elapsed)} / {formatDuration(MAX_RECORDING_MS)}
            </span>
          </div>
          <div className="audio-track" aria-hidden="true">
            <span style={{ width: `${(elapsed / MAX_RECORDING_MS) * 100}%` }} />
          </div>
          <div className="preview-actions">
            <button type="button" className="btn-secondary" onClick={recorder.cancel}>
              Cancelar
            </button>
            <button type="button" className="btn-stop" onClick={recorder.stop} disabled={state.status !== 'recording'}>
              <StopIcon /> Parar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ----- Vazio (com ou sem erro de microfone) -----
  return (
    <div className="audio-input">
      {fileInput}
      {state.status === 'error' ? (
        <div className="mic-error" role="alert">
          <p className="mic-error-title">
            <AlertIcon size={18} /> {MIC_ERROR_MESSAGES[state.error]}
          </p>
          <p>Você pode enviar um arquivo de áudio ou escrever a situação em texto.</p>
          <div className="preview-actions">
            <button type="button" className="btn-secondary" onClick={() => fileRef.current?.click()}>
              Enviar arquivo
            </button>
            <button type="button" className="btn-secondary" onClick={onUseText}>
              Usar texto
            </button>
          </div>
          {state.error !== 'unavailable' && (
            <button type="button" className="btn-inline" onClick={startRecording}>
              Tentar o microfone de novo
            </button>
          )}
        </div>
      ) : (
        <div className="audio-empty">
          <p className="audio-hint">{hint}</p>
          <div className="preview-actions">
            <button type="button" className="btn-record" onClick={startRecording}>
              <MicIcon /> Gravar
            </button>
            <button type="button" className="btn-secondary" onClick={() => fileRef.current?.click()}>
              Enviar arquivo
            </button>
          </div>
        </div>
      )}
      <p className="field-help">
        Gravação de até 3 minutos ou arquivo de até 10 MB (MP3, M4A, OGG, OPUS, WAV, WEBM).
      </p>
      <p className="field-help with-icon">
        <LockIcon /> O áudio fica só neste navegador e não é enviado.
      </p>
      <ErrorLine error={error} />
    </div>
  )
}

function ErrorLine({ error }: { error: string | null }) {
  return (
    <p className="field-error" role="alert">
      {error && (
        <>
          <AlertIcon />
          {error}
        </>
      )}
    </p>
  )
}
