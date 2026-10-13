import { GroupedResults } from '../../../shared/search/GroupedResults'
import { groupResults } from '../../../shared/search/listPresentation'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router'
import { Wallet, Plus } from 'lucide-react'
import { HPageBreadcrumb } from '../../../shared/ui/HPageBreadcrumb'
import { HPageHeader } from '../../../shared/ui/HPageHeader'
import { HButton } from '../../../shared/ui/HButton'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { HListPagination } from '../../../shared/ui/HListPagination'
import { HTag } from '../../../shared/ui/HTag'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HInput } from '../../../shared/ui/HInput'
import { PaymentDialog } from '../components/PaymentDialog'
import { billingService } from '../services/BillingService'
import { useBillingAccess } from '../hooks/useBillingAccess'
import { formatAmount } from '../../../shared/formatters/money'
import { displayDate } from '../../../shared/time/zonedDate'
import type { Payment } from '../schemas/billing'
export function PaymentsPage() {
  const access = useBillingAccess(), client = useQueryClient(), [params, setParams] = useSearchParams(), page = Math.max(1, Number(params.get('page')) || 1), [adding, setAdding] = useState(false), [cancel, setCancel] = useState<Payment>(), [reason, setReason] = useState('')
  const query = useQuery({ queryKey: ['billing', 'payments', params.toString()], queryFn: () => billingService.payments({ ...Object.fromEntries(params), page }), enabled: access.canRead, retry: false }), remove = useMutation({ mutationFn: () => billingService.cancelPayment(cancel!.id, cancel!.updated, reason), onSuccess: async () => { setCancel(undefined); setReason(''); await client.invalidateQueries({ queryKey: ['billing'] }) } })
  const table = (rows: Payment[]) => <HDataTable columnBorders data={rows} columns={[{ header: 'Date', cell: ({ row }) => displayDate(row.original.payment_date) }, { header: 'Tiers', accessorKey: 'company_name' }, { header: 'Direction', cell: ({ row }) => row.original.direction === 'customer' ? 'Client' : 'Fournisseur' }, { header: 'Montant', cell: ({ row }) => formatAmount(row.original.amount, row.original.currency) }, { header: 'Mode', accessorKey: 'method' }, { header: 'Référence', accessorKey: 'reference' }, { header: 'Pièces', cell: ({ row }) => row.original.allocations.map((allocation, index) => <HButton key={allocation.id} size="small" asChild><Link to={`/billing/${allocation.kind}/${allocation.id}`}>Pièce {index + 1}</Link></HButton>) }, { header: 'État', cell: ({ row }) => <HTag tone={row.original.status === 'validated' ? 'green' : 'navy'}>{row.original.status === 'validated' ? 'Enregistré' : 'Annulé'}</HTag> }, { header: 'Actions', cell: ({ row }) => access.canPay && row.original.status === 'validated' && <HButton size="small" onClick={() => { setCancel(row.original); setReason('') }}>Annuler le règlement</HButton> }]} />
  if (!access.canRead) return <HEmptyState icon={Wallet} title="Règlements" description="Vous ne disposez pas de l’accès à la facturation." />
  return <div className="contact-directory"><HPageBreadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Facturation', href: params.get('direction') === 'supplier' ? '/billing?direction=supplier' : '/billing' }, { label: 'Règlements' }]} /><HPageHeader title="Règlements" description="Encaissements, paiements et remboursements enregistrés." actions={access.canPay && <HButton variant="primary" onClick={() => setAdding(true)}><Plus size={14} />Nouveau règlement</HButton>} /><HListPagination label="Pagination des règlements" page={page} totalPages={query.data?.totalPages} busy={query.isFetching} onPageChange={(value) => setParams((current) => { const next = new URLSearchParams(current); next.set('page', String(value)); return next })} />{query.isPending && <HLoadingIndicator label="Chargement des règlements" />}{query.error && <p role="alert" className="field-error">{query.error.message}<HButton onClick={() => void query.refetch()}>Réessayer</HButton></p>}
    {query.data && (params.get('group') && params.get('group') !== 'none' ? <GroupedResults icon={Wallet} noun="règlements" groups={groupResults(query.data.items, (row) => ({ key: params.get('group') === 'status' ? row.status : row.company, label: params.get('group') === 'status' ? row.status === 'validated' ? 'Enregistrés' : 'Annulés' : row.company_name }))} render={table} /> : table(query.data.items))}
    {adding && <PaymentDialog onClose={() => setAdding(false)} />}{cancel && <HDialog open title="Annuler le règlement" description="La correction sera conservée dans l’historique et les soldes seront recalculés." onOpenChange={(open) => { if (!open && !remove.isPending) setCancel(undefined) }}><div className="dialog-form"><label>Motif<HInput aria-label="Motif d’annulation du règlement" value={reason} onChange={(event) => setReason(event.target.value)} /></label>{remove.error && <p role="alert" className="field-error">{remove.error.message}</p>}<HDialogFooter><HButton disabled={remove.isPending} onClick={() => setCancel(undefined)}>Fermer</HButton><HButton variant="primary" disabled={!reason.trim() || remove.isPending} onClick={() => remove.mutate()}>Confirmer l’annulation</HButton></HDialogFooter></div></HDialog>}
  </div>
}
