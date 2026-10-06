import { useContext } from 'react'
import { createPortal } from 'react-dom'
import { BreadcrumbActionsContext } from './breadcrumbActionsContext'
import { HBreadcrumb, type BreadcrumbItem } from './HBreadcrumb'

export function HPageBreadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const target = useContext(BreadcrumbActionsContext).trail
  return target ? createPortal(<HBreadcrumb items={items} />, target) : null
}
