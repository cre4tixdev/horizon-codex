import type { ReactNode } from 'react'

/** Même cadre pour les recherches contextuelles, globales et leur aperçu UX. */
export function HWorkspaceSearchField({ children }: { children: ReactNode }) {
  return <div className="workspace-search workspace-search--contextual">{children}</div>
}
