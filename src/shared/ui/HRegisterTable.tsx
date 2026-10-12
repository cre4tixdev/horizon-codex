import type { ColumnDef } from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { HDataTable } from './HDataTable'
import { HButton } from './HButton'
import { HBreadcrumbActions } from './HBreadcrumbActions'
import { HLoadingIndicator } from './HLoadingIndicator'
import { GroupedResults } from '../search/GroupedResults'
import { groupResults } from '../search/listPresentation'
export function HRegisterTable<T>({ data, columns, rowLink, grouping, icon, pending, error, onRetry, alignments = {} }: { data?: { items: T[]; page: number; totalPages: number; totalItems: number } | undefined; columns: ColumnDef<T>[]; rowLink: (item: T) => { href: string; label: string; state?: unknown }; grouping?: ((item: T) => { key: string; label: string }) | undefined; icon: LucideIcon; pending: boolean; error: Error | null; onRetry: () => void; alignments?: Record<string, 'left' | 'center' | 'right'> }) {
  const [params, setParams] = useSearchParams(), page = Number(params.get('page')) || 1
  const table = (items: T[]) => <HDataTable columnBorders resizable columnAlignments={alignments} columns={columns} data={items} getRowLink={rowLink} />
  return <><HBreadcrumbActions><nav className="record-navigator"><span>{page} / {data?.totalPages || 1}</span><HButton variant="ghost" size="icon" aria-label="Page précédente" disabled={page <= 1} onClick={() => setParams((p) => { p.set('page', String(page - 1)); return p })}><ChevronLeft size={14} /></HButton><HButton variant="ghost" size="icon" aria-label="Page suivante" disabled={!data || page >= data.totalPages} onClick={() => setParams((p) => { p.set('page', String(page + 1)); return p })}><ChevronRight size={14} /></HButton></nav></HBreadcrumbActions>{pending ? <HLoadingIndicator label="Chargement du registre" /> : error ? <p role="alert" className="field-error">{error.message}<HButton onClick={onRetry}>Réessayer</HButton></p> : data && <>{grouping ? <GroupedResults icon={icon} noun="éléments" groups={groupResults(data.items, grouping)} render={table} /> : table(data.items)}<p className="contact-muted">{data.totalItems} élément(s)</p></>}</>
}
