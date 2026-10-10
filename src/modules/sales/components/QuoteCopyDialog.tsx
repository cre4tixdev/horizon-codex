import { useDeferredValue, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Copy, Search, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HTag } from '../../../shared/ui/HTag'
import { HInput } from '../../../shared/ui/HInput'
import { HButton } from '../../../shared/ui/HButton'
import { HFieldLabel } from '../../../shared/ui/HFieldLabel'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { formatAmount } from '../../../shared/formatters/money'
import { salesService } from '../services/SalesService'
import { quoteStatusTones, quoteStatusLabels, type Quote } from '../schemas/quotes'

export function QuoteCopyDialog({ currentId, description, busy, error, onClose, onCopy }: { currentId: string | undefined; description: string; busy: boolean; error: string | undefined; onClose: () => void; onCopy: (source: Quote) => void }) {
  const [search, setSearch] = useState(''), [page, setPage] = useState(1)
  const [source, setSource] = useState<Quote>(), [confirmation, setConfirmation] = useState('')
  const query = useDeferredValue(search)
  const results = useQuery({ queryKey: ['sales', 'copy-search', query, page], queryFn: () => salesService.list({ q: query, page, opportunity: '', company: '', status: '', sort: '-created' }), retry: false })
  const columns: ColumnDef<Quote>[] = [
    { header: 'Numéro', cell: ({ row }) => <span className="quote-copy-number" data-selected={source?.id === row.original.id}>{source?.id === row.original.id && <Check size={13} />}{row.original.quote_number}</span>, size: 105 },
    { header: 'Devis', accessorKey: 'title', size: 240 },
    { header: 'Client', accessorKey: 'company_name', size: 160 },
    { header: 'État', cell: ({ row }) => <HTag tone={quoteStatusTones[row.original.status]}>{quoteStatusLabels[row.original.status]}</HTag>, size: 110 },
    { header: 'Total HT', cell: ({ row }) => formatAmount(row.original.subtotal, row.original.currency), size: 120 },
  ]
  return <HDialog open title="Copier un devis" description={description} className="quote-copy-dialog" onOpenChange={(open) => { if (!open && !busy) onClose() }}>
    <div className="dialog-form">
      <div className="quote-product-search"><Search size={15} /><HInput autoFocus aria-label="Rechercher un devis à copier" placeholder="Numéro, titre, client ou opportunité…" maxLength={200} value={search} disabled={busy} onChange={(event) => { setSearch(event.target.value); setPage(1) }} /></div>
      <div className="quote-copy-results" aria-busy={results.isFetching}>{results.isPending && <HLoadingIndicator label="Recherche des devis" />}{results.error && <p role="alert" className="field-error">{results.error.message}<HButton onClick={() => void results.refetch()}>Réessayer</HButton></p>}{results.data && !results.data.items.some((item) => item.id !== currentId) && <p className="contact-muted">Aucun autre devis trouvé.</p>}{results.data && <HDataTable columnBorders data={results.data.items.filter((item) => item.id !== currentId)} columns={columns} getRowAction={(item) => ({ label: `Copier le devis ${item.quote_number}`, onClick: () => { if (!busy) { setSource(item); setConfirmation('') } } })} />}</div>
      <div className="record-navigator"><span>Page {page} / {Math.max(1, results.data?.totalPages || 1)}</span><HButton size="icon" variant="ghost" aria-label="Devis précédents" disabled={busy || results.isFetching || page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={14} /></HButton><HButton size="icon" variant="ghost" aria-label="Devis suivants" disabled={busy || results.isFetching || page >= (results.data?.totalPages || 1)} onClick={() => setPage(page + 1)}><ChevronRight size={14} /></HButton></div>
      {source && <><p className="contact-muted">Source : <strong>{source.quote_number} · {source.title}</strong> — {source.lines.length} ligne(s)</p><label><HFieldLabel>Saisissez COPIER pour confirmer</HFieldLabel><HInput aria-label="Confirmation de copie" autoComplete="off" spellCheck={false} value={confirmation} disabled={busy} onChange={(event) => setConfirmation(event.target.value)} /></label></>}
      {error && <p role="alert" className="field-error">{error}</p>}
      <HDialogFooter><HButton variant="primary" disabled={busy || !source || confirmation !== 'COPIER'} onClick={() => { if (source && confirmation === 'COPIER') onCopy(source) }}><Copy size={14} />{busy ? 'Copie…' : 'Copier le devis'}</HButton></HDialogFooter>
    </div>
  </HDialog>
}
