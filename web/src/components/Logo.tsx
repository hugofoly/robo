export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg
      className="logo-mark"
      width={size}
      height={(size * 56) / 64}
      viewBox="0 0 64 56"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M26 2h12l-2 4H28z" fill="var(--logo-antenna, var(--accent))" />
      <rect x="2" y="17" width="4" height="16" rx="1.5" fill="var(--logo-ear)" />
      <rect x="58" y="17" width="4" height="16" rx="1.5" fill="var(--logo-ear)" />
      <path d="M18 5h28l10 10v20L46 45H20l-9 6 1-8-4-8V15z" fill="var(--logo-shell)" />
      <rect x="15" y="13" width="34" height="27" rx="8" fill="var(--logo-visor)" />
      <rect x="20" y="24" width="8" height="3.4" rx="1.7" fill="var(--accent)" />
      <path d="M36 25.5l8.5-2.2.6 2.4-8.6 1.6z" fill="var(--accent)" />
      <path d="M28.5 32.5q3.5 2.6 7 0" stroke="var(--logo-shell)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  )
}

/** Marca dentro de um tile no formato de ícone de app; funciona em tema claro e escuro. */
export function AppIcon({ size = 44 }: { size?: number }) {
  return (
    <span className="app-icon" style={{ width: size, height: size }}>
      <LogoMark size={Math.round(size * 0.74)} />
    </span>
  )
}
