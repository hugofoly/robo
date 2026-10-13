// Ícones de traço no estilo SF Symbols. Decorativos: o rótulo vem do texto ao lado.
type Props = { size?: number }

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
})

export const SparklesIcon = ({ size = 22 }: Props) => (
  <svg {...base(size)}>
    <path d="M12 3l1.7 4.6L18 9.3l-4.3 1.7L12 15.6l-1.7-4.6L6 9.3l4.3-1.7z" />
    <path d="M19 15l.7 1.8 1.8.7-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7z" />
  </svg>
)

export const WandIcon = ({ size = 22 }: Props) => (
  <svg {...base(size)}>
    <path d="M4 20L15 9" />
    <path d="M14 5l1-2 1 2 2 1-2 1-1 2-1-2-2-1z" />
    <path d="M19 12l.5 1 1 .5-1 .5-.5 1-.5-1-1-.5 1-.5z" />
  </svg>
)

export const BubblesIcon = ({ size = 22 }: Props) => (
  <svg {...base(size)}>
    <path d="M4 5h11a2 2 0 012 2v6a2 2 0 01-2 2H9l-4 3v-3H4a2 2 0 01-2-2V7a2 2 0 012-2z" />
    <path d="M19 9h1a2 2 0 012 2v5a2 2 0 01-2 2h-1v3l-4-3h-3" />
  </svg>
)

export const PhotoIcon = ({ size = 22 }: Props) => (
  <svg {...base(size)}>
    <rect x="3" y="4" width="18" height="16" rx="3" />
    <circle cx="9" cy="10" r="1.8" />
    <path d="M21 16l-5-5-9 9" />
  </svg>
)

export const TextIcon = ({ size = 22 }: Props) => (
  <svg {...base(size)}>
    <path d="M5 6h14M5 11h14M5 16h9" />
  </svg>
)

export const XIcon = ({ size = 16 }: Props) => (
  <svg {...base(size)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)

export const AlertIcon = ({ size = 16 }: Props) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5.5M12 16.5v.01" />
  </svg>
)

export const LockIcon = ({ size = 14 }: Props) => (
  <svg {...base(size)}>
    <rect x="5" y="11" width="14" height="10" rx="2.5" />
    <path d="M8 11V8a4 4 0 018 0v3" />
  </svg>
)

export const CopyIcon = ({ size = 16 }: Props) => (
  <svg {...base(size)}>
    <rect x="8" y="8" width="12" height="12" rx="2.5" />
    <path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" />
  </svg>
)

export const CheckIcon = ({ size = 16 }: Props) => (
  <svg {...base(size)}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
)

export const StarIcon = ({ size = 14 }: Props) => (
  <svg {...base(size)} fill="currentColor" strokeWidth={0}>
    <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z" />
  </svg>
)

export const ThumbUpIcon = ({ size = 16 }: Props) => (
  <svg {...base(size)}>
    <path d="M7 10v10H4V10zM7 10l4-7a2 2 0 012.6 2.4L12.5 9H18a2 2 0 012 2.3l-1.2 7A2 2 0 0116.8 20H7" />
  </svg>
)

export const ThumbDownIcon = ({ size = 16 }: Props) => (
  <svg {...base(size)}>
    <path d="M7 14V4H4v10zM7 14l4 7a2 2 0 002.6-2.4L12.5 15H18a2 2 0 002-2.3l-1.2-7A2 2 0 0016.8 4H7" />
  </svg>
)

export const SendIcon = ({ size = 18 }: Props) => (
  <svg {...base(size)}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </svg>
)

export const MicIcon = ({ size = 18 }: Props) => (
  <svg {...base(size)}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0014 0M12 18v3" />
  </svg>
)

export const WaveIcon = ({ size = 16 }: Props) => (
  <svg {...base(size)}>
    <path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2" />
  </svg>
)

export const PlayIcon = ({ size = 18 }: Props) => (
  <svg {...base(size)} fill="currentColor" strokeWidth={0}>
    <path d="M8 5.5v13a1 1 0 001.5.9l10.5-6.5a1 1 0 000-1.8L9.5 4.6A1 1 0 008 5.5z" />
  </svg>
)

export const PauseIcon = ({ size = 18 }: Props) => (
  <svg {...base(size)} fill="currentColor" strokeWidth={0}>
    <rect x="6" y="5" width="4" height="14" rx="1.2" />
    <rect x="14" y="5" width="4" height="14" rx="1.2" />
  </svg>
)

export const StopIcon = ({ size = 16 }: Props) => (
  <svg {...base(size)} fill="currentColor" strokeWidth={0}>
    <rect x="6" y="6" width="12" height="12" rx="2.5" />
  </svg>
)

export const ChevronIcon = ({ size = 16 }: Props) => (
  <svg {...base(size)}>
    <path d="M9 5l7 7-7 7" />
  </svg>
)

export const BackIcon = ({ size = 18 }: Props) => (
  <svg {...base(size)}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
)

export const ShieldIcon = ({ size = 16 }: Props) => (
  <svg {...base(size)}>
    <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
  </svg>
)

export const HeartIcon = ({ size = 22 }: Props) => (
  <svg {...base(size)}>
    <path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" />
  </svg>
)

export const CameraIcon = ({ size = 22 }: Props) => (
  <svg {...base(size)}>
    <path d="M4 8h3l2-3h6l2 3h3a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
)

export const MoveIcon = ({ size = 14 }: Props) => (
  <svg {...base(size)}>
    <path d="M8 4v16M4 8l4-4 4 4M16 20V4M12 16l4 4 4-4" />
  </svg>
)

export const PlusIcon = ({ size = 22 }: Props) => (
  <svg {...base(size)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)
