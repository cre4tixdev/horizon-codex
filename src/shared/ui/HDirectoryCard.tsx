import type { ReactNode } from 'react'

/** Structure et présentation communes aux cartes des annuaires métier. */
export function HDirectoryCard({ portrait, title, children, footer, compactTitle = false }: { portrait: ReactNode; title: ReactNode; children: ReactNode; footer: ReactNode; compactTitle?: boolean }) {
  return <article className={`contact-directory-card${compactTitle ? ' contact-directory-card--person' : ''}`}>
    {portrait}
    <div className="contact-card-body">{title}{children}</div>
    <div className="contact-card-footer">{footer}</div>
  </article>
}
