import { ChevronLeft, ChevronRight } from 'lucide-react'
import { HButton } from './HButton'
import { HBreadcrumbActions } from './HBreadcrumbActions'

export function HListPagination({ page, totalPages, label, busy = false, placement = 'breadcrumb', onPageChange }: {
  page: number
  totalPages: number | undefined
  label: string
  placement?: 'breadcrumb' | 'inline'
  busy?: boolean
  onPageChange: (page: number) => void
}) {
  const pages = Math.max(1, totalPages || 1)
  const navigation = <nav className="record-navigator" aria-label={label} aria-busy={busy}>
    <span className="record-navigator-count" aria-live="polite" title="Page actuelle / nombre de pages">Page {page} / {pages}</span>
    <HButton variant="ghost" size="icon" aria-label="Page précédente" title="Page précédente" disabled={page <= 1 || busy} onClick={() => onPageChange(page - 1)}><ChevronLeft size={14} /></HButton>
    <HButton variant="ghost" size="icon" aria-label="Page suivante" title="Page suivante" disabled={page >= pages || busy} onClick={() => onPageChange(page + 1)}><ChevronRight size={14} /></HButton>
  </nav>
  return placement === 'inline' ? navigation : <HBreadcrumbActions>{navigation}</HBreadcrumbActions>
}
