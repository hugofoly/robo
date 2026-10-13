import { useEffect, useRef, useState } from 'react'
import { formatDuration } from '../lib/audio'
import { PauseIcon, PlayIcon } from './Icons'

interface Props {
  url: string
  name: string
  /** Duração conhecida (gravações em WebM às vezes não informam duração nos metadados). */
  durationMs: number | null
}

export function AudioPlayer({ url, name, durationMs }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [metaDuration, setMetaDuration] = useState<number | null>(null)

  const total = durationMs ?? metaDuration

  // Troca de arquivo: volta ao início.
  useEffect(() => {
    setPlaying(false)
    setCurrent(0)
    setMetaDuration(null)
  }, [url])

  async function toggle() {
    const el = audioRef.current
    if (!el) return
    if (el.paused) {
      try {
        await el.play()
      } catch {
        setPlaying(false)
      }
    } else {
      el.pause()
    }
  }

  const progress = total ? Math.min(100, (current / total) * 100) : 0

  return (
    <div className="audio-player">
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false)
          setCurrent(0)
        }}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime * 1000)}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration
          if (Number.isFinite(d)) setMetaDuration(d * 1000)
        }}
      />
      <button type="button" className="btn-play" onClick={toggle} aria-label={playing ? 'Pausar' : 'Reproduzir'}>
        {playing ? <PauseIcon /> : <PlayIcon />}
      </button>
      <div className="audio-body">
        <span className="audio-name" title={name}>
          {name}
        </span>
        <div className="audio-track" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
        <span className="audio-time">
          {formatDuration(current)}
          {total ? ` / ${formatDuration(total)}` : ''}
        </span>
      </div>
    </div>
  )
}
