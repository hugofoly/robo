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
