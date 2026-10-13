import type { ReactNode } from 'react'

export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h2>{title}</h2>
      <div className="empty-body">{children}</div>
    </section>
  )
}
