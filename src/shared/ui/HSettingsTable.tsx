import { HTableViewport } from './HTableViewport'
import type { ReactNode } from 'react'

export function HSettingsTable({ children, count, noun = 'valeur' }: { children: ReactNode; count?: number | undefined; noun?: string }) {
  return <>
    <HTableViewport className="settings-reference-table">{children}</HTableViewport>
    {count !== undefined && <p className="contact-muted settings-table-count">{count} {noun}{count === 1 ? '' : 's'}</p>}
  </>
}
