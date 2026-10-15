import type { ListTableSorting } from '../search/useListTableSorting'
import type { ColumnDef } from '@tanstack/react-table'
import type { LucideIcon } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { HDataTable } from './HDataTable'
import { HButton } from './HButton'
import { HListPagination } from './HListPagination'
import { HLoadingIndicator } from './HLoadingIndicator'
import { GroupedResults } from '../search/GroupedResults'
import { groupResults } from '../search/listPresentation'
export function HRegisterTable<T>({ data, columns, rowLink, grouping, icon, pending, busy = pending, error, onRetry, alignments = {}, listSorting }: { listSorting?: ListTableSorting; data?: { items: T[]; page: number; totalPages: number; totalItems: number } | undefined; columns: ColumnDef<T>[]; rowLink: (item: T) => { href: string; label: string; state?: unknown }; grouping?: ((item: T) => { key: string; label: string }) | undefined; icon: LucideIcon; pending: boolean; busy?: boolean; error: Error | null; onRetry: () => void; alignments?: Record<string, 'left' | 'center' | 'right'> }) {
  const [params, setParams] = useSearchParams(), page = Math.max(1, Number(params.get('page')) || 1)
  const table = (items: T[]) => <HDataTable {...(listSorting ? { listSorting } : {})} columnBorders resizable columnAlignments={alignments} columns={columns} data={items} getRowLink={rowLink} />
  return <><HListPagination page={page} totalPages={data?.totalPages} label="Pagination du registre" busy={busy} onPageChange={(nextPage) => setParams((current) => { const next = new URLSearchParams(current); next.set('page', String(nextPage)); return next })} />{pending ? <HLoadingIndicator label="Chargement du registre" /> : error ? <p role="alert" className="field-error">{error.message}<HButton onClick={onRetry}>Réessayer</HButton></p> : data && <>{grouping ? <GroupedResults icon={icon} noun="éléments" groups={groupResults(data.items, grouping)} render={table} /> : table(data.items)}<p className="contact-muted">{data.totalItems} élément(s)</p></>}</>
}
