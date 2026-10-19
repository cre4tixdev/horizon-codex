import type { ListPageSizeControl } from '../hooks/useListPageSize'
import { HCombobox } from './HCombobox'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { HButton } from './HButton'
import { HBreadcrumbActions } from './HBreadcrumbActions'

export function HListPagination({ pageSize, page, totalPages, label, busy = false, placement = 'breadcrumb', onPageChange }: {
  pageSize?: ListPageSizeControl | undefined
  page: number
  totalPages: number | undefined
  label: string
  placement?: 'breadcrumb' | 'inline'
  busy?: boolean
  onPageChange: (page: number) => void
}) {
  const pages = Math.max(1, totalPages || 1)
  const navigation = <nav className="record-navigator" aria-label={label} aria-busy={busy}>
    {pageSize && <div className="list-page-size"><HCombobox label="Résultats par page" value={pageSize.value} onChange={pageSize.onChange} clearable={false} required showCodes={false} options={[{ value: 'auto', label: `Auto · ${pageSize.automatic}/page` }, ...[25, 50, 100].map((size) => ({ value: String(size), label: `${size} / page` }))]} /></div>}
    <span className="record-navigator-count" aria-live="polite" title="Page actuelle / nombre de pages">Page {page} / {pages}</span>
    <HButton variant="ghost" size="icon" aria-label="Page précédente" title="Page précédente" disabled={page <= 1 || busy} onClick={() => onPageChange(page - 1)}><ChevronLeft size={14} /></HButton>
    <HButton variant="ghost" size="icon" aria-label="Page suivante" title="Page suivante" disabled={page >= pages || busy} onClick={() => onPageChange(page + 1)}><ChevronRight size={14} /></HButton>
  </nav>
  return placement === 'inline' ? navigation : <HBreadcrumbActions>{navigation}</HBreadcrumbActions>
}
