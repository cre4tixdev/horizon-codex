import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowUpRight, ChevronLeft, ChevronRight, Database } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { HButton } from '../../../shared/ui/HButton'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { HTag } from '../../../shared/ui/HTag'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { formatAmount } from '../../../shared/formatters/money'
import { sources, type WidgetDataSpec } from '../schemas/widgetData'
import type { WidgetRecord } from '../services/widgetRecords'
const columns: ColumnDef<WidgetRecord>[] = [
  { id: 'title', header: 'Pièce / Client', accessorKey: 'title', cell: ({ row }) => <div className="dashboard-business-identity"><strong className="h-data-table-record-name">{row.original.reference} · {row.original.title}</strong><small>{row.original.company}</small></div> },
  { id: 'amount', header: 'Montant HT', cell: ({ row }) => formatAmount(row.original.amount, row.original.currency) },
  { id: 'status', header: 'État', cell: ({ row }) => <HTag tone={row.original.tone || 'navy'} color={row.original.color}>{row.original.status}</HTag> },
]
export function WidgetRecordTable({ items }: { items: WidgetRecord[] }) {
  return <HDataTable data={items} columns={columns} columnBorders columnWidths={{ amount: 120, status: 120 }} columnAlignments={{ amount: 'right', status: 'center' }} getRowLink={(item) => ({ href: item.href, label: `Ouvrir ${item.reference}` })} />
}
export function WidgetRecordsView({ data, items, totalItems, totalPages = 1, page = 1, busy = false, href, embedded = false, onPage, notice }: { data: WidgetDataSpec; items: WidgetRecord[]; totalItems: number; totalPages?: number; page?: number; busy?: boolean; href?: string; embedded?: boolean; onPage?: (page: number) => void; notice?: ReactNode }) {
  const title = data.title || sources[data.source]
  return <section className={`panel h-dashboard-card h-tone dashboard-record-widget${embedded ? ' dashboard-record-widget--embedded' : ''}`} data-tone="navy" aria-label={title}>
    <div className="panel-heading"><h2><Database size={17} />{title}</h2>{href && <Link className="panel-icon-link" aria-label={`Tout voir : ${title}`} to={href}><ArrowUpRight size={16} /></Link>}</div>
    {notice}<div className="dashboard-widget-body">{data.presentation === 'count' ? <strong className="dashboard-record-count">{totalItems.toLocaleString('fr-FR')}</strong> : !items.length ? <HEmptyState icon={Database} title="Aucun résultat" description="Aucun dossier ne correspond aux critères du widget." /> : data.presentation === 'table' ? <WidgetRecordTable items={items} /> : <ul className="dashboard-record-list">{items.map((item) => <li key={item.id}><Link to={item.href}><div><strong>{item.reference} · {item.title}</strong><small>{item.company} · {item.status}</small></div><span>{formatAmount(item.amount, item.currency)}</span></Link></li>)}</ul>}</div>
    {data.presentation !== 'count' && <footer className="dashboard-record-pagination"><span>{totalItems} résultat(s)</span><HButton size="icon" variant="ghost" aria-label="Résultats précédents" disabled={page <= 1 || busy || !onPage} onClick={() => onPage?.(page - 1)}><ChevronLeft size={14} /></HButton><span>{Math.min(page, Math.max(1, totalPages))} / {Math.max(1, totalPages)}</span><HButton size="icon" variant="ghost" aria-label="Résultats suivants" disabled={page >= totalPages || busy || !onPage} onClick={() => onPage?.(page + 1)}><ChevronRight size={14} /></HButton></footer>}
  </section>
}
