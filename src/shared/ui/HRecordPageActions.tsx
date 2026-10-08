import { useContext, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { BreadcrumbActionsContext } from './breadcrumbActionsContext'

export function HRecordPageActions({ children, inline = false, inert = false }: { children: ReactNode; inline?: boolean; inert?: boolean }) {
  const target = useContext(BreadcrumbActionsContext).actions
  const actions = <div className="contact-record-actions" inert={inert}>{children}</div>
  return !inline && target ? createPortal(actions, target) : actions
}
