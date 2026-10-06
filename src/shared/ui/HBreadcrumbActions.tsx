import { useContext, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { BreadcrumbActionsContext } from './breadcrumbActionsContext'

export function HBreadcrumbActions({ children, placement = 'navigation' }: { children: ReactNode; placement?: 'navigation' | 'related' }) {
  const target = useContext(BreadcrumbActionsContext)[placement]
  return target ? createPortal(children, target) : null
}
