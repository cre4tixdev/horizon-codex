import { HListPagination } from '../../../shared/ui/HListPagination'
import type { ColumnDef } from '@tanstack/react-table'
import { useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HButton } from '../../../shared/ui/HButton'
import { HInput } from '../../../shared/ui/HInput'
import { HAmountInput } from '../../../shared/ui/HAmountInput'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { formatAmount } from '../../../shared/formatters/money'
import { billingService } from '../services/BillingService'
import type { Bill, BillKind, PaymentAllocation } from '../schemas/billing'
type Row = { id: string; cells: ReactNode[] }
const columns: ColumnDef<Row>[] = ['Pièce', 'Solde', 'À affecter'].map((header, index) => ({ id: String(index), header, cell: ({ row }) => row.original.cells[index] }))
export function PaymentDialog({ record, onClose }: { record?: Bill; onClose: () => void }) {
  const [kind, setKind] = useState<BillKind>(record?.kind || 'customer'), [company, setCompany] = useState(record?.company || ''), [date, setDate] = useState(new Date().toLocaleDateString('en-CA')), [method, setMethod] = useState('Virement'), [reference, setReference] = useState(''), [allocations, setAllocations] = useState<PaymentAllocation[]>(record ? [{ kind: record.kind, id: record.id, amount: record.balance }] : []), [key] = useState(() => crypto.randomUUID()), [page, setPage] = useState(1), client = useQueryClient()
  const choices = useQuery({ queryKey: ['billing', 'choices'], queryFn: billingService.choices, retry: false }), query = useQuery({ queryKey: ['billing', 'payment-targets', kind, company, page], queryFn: () => billingService.list({ kind, company, status: 'unpaid', page }), enabled: Boolean(company), retry: false })
  const pay = useMutation({ mutationFn: () => billingService.pay({ creation_key: key, payment_date: date, method, reference, allocations }), onSuccess: async () => { await client.invalidateQueries({ queryKey: ['billing'] }); onClose() } })
  const total = allocations.reduce((sum, item) => sum + item.amount, 0)
  return <HDialog open description="" title={kind.endsWith('_credit') ? 'Enregistrer un remboursement' : 'Enregistrer un règlement'} onOpenChange={(open) => { if (!open && !pay.isPending) onClose() }}><div className="dialog-form"><div className="billing-fields">{!record && <label>Direction<HCombobox label="Direction du règlement" value={kind} clearable={false} showCodes={false} options={[{ value: 'customer', label: 'Encaissement client' }, { value: 'supplier', label: 'Paiement fournisseur' }]} onChange={(value) => { setKind(value === 'supplier' ? 'supplier' : 'customer'); setCompany(''); setAllocations([]); setPage(1) }} /></label>}<label>Tiers<HCombobox label="Tiers du règlement" value={company} disabled={Boolean(record)} showCodes={false} options={[...((kind.startsWith('supplier') ? choices.data?.suppliers : choices.data?.companies) || []).map((item) => ({ value: item.id, label: item.name })), ...(record && !choices.data?.companies.some((item) => item.id === record.company) ? [{ value: record.company, label: record.company_name }] : [])]} onChange={(value) => { setCompany(value); setAllocations([]); setPage(1) }} /></label><label>Date<HInput aria-label="Date du règlement" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><label>Mode<HInput aria-label="Mode du règlement" value={method} onChange={(event) => setMethod(event.target.value)} /></label></div><label>Référence<HInput aria-label="Référence du règlement" value={reference} onChange={(event) => setReference(event.target.value)} /></label>
    {query.isPending && company && <HLoadingIndicator label="Chargement des pièces à régler" />}{query.data && <HDataTable<Row> columnBorders columns={columns} data={query.data.items.map((bill) => ({ id: bill.id, cells: [bill.number, formatAmount(bill.balance, 'EUR'), <HAmountInput aria-label={`Montant pour ${bill.number}`} inlineCurrency currency="EUR" min={0} value={allocations.find((item) => item.id === bill.id)?.amount || 0} onChange={(amount) => setAllocations((current) => [...current.filter((item) => item.id !== bill.id), ...(amount > 0 ? [{ kind, id: bill.id, amount }] : [])])} />] }))} />}
    {query.data && <HListPagination page={page} totalPages={query.data.totalPages} busy={query.isFetching} onPageChange={setPage} label="Pièces à régler" />}
    <p>Total affecté : <strong>{formatAmount(total, 'EUR')}</strong></p>{(pay.error || query.error || choices.error) && <p role="alert" className="field-error">{pay.error?.message || query.error?.message || choices.error?.message}</p>}<HDialogFooter><HButton disabled={pay.isPending} onClick={onClose}>Annuler</HButton><HButton variant="primary" disabled={pay.isPending || total <= 0 || !method.trim()} onClick={() => pay.mutate()}>Enregistrer le règlement</HButton></HDialogFooter></div></HDialog>
}
