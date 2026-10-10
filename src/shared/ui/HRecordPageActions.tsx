import { useContext, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { BreadcrumbActionsContext } from './breadcrumbActionsContext'

export function HRecordPageActions({ children, inline = false, inert = false, placement = 'actions' }: { children: ReactNode; inline?: boolean; inert?: boolean; placement?: 'actions' | 'workflow' }) {
  const target = useContext(BreadcrumbActionsContext)[placement]
  const actions = <div className="contact-record-actions" inert={inert}>{children}</div>
  return !inline && target ? createPortal(actions, target) : actions
}
