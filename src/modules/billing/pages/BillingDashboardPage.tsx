import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { Wallet, FilePenLine, CircleDollarSign, Clock3, Receipt, Plus, ArrowUpRight } from 'lucide-react'
import { HPageBreadcrumb } from '../../../shared/ui/HPageBreadcrumb'
import { HPageHeader } from '../../../shared/ui/HPageHeader'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HSummaryCards } from '../../../shared/ui/HSummaryCards'
import { HButton } from '../../../shared/ui/HButton'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { formatAmount } from '../../../shared/formatters/money'
import { displayDate } from '../../../shared/time/zonedDate'
import { billingService } from '../services/BillingService'
import { useBillingAccess } from '../hooks/useBillingAccess'
export function BillingDashboardPage() {
  const access = useBillingAccess(), query = useQuery({ queryKey: ['billing', 'dashboard'], queryFn: billingService.dashboard, enabled: access.canRead, retry: false, refetchInterval: 30000 })
  if (!access.canRead) return <HEmptyState icon={Wallet} title="Facturation" description="Vous ne disposez pas de l’accès à la facturation." />
  return <div className="contact-directory"><HPageBreadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Facturation' }]} /><HPageHeader title="Facturation" description="Encaissements clients, factures fournisseurs et échéances." actions={access.canWrite && <><HButton asChild><Link to="/billing/supplier/new"><Plus size={14} />Enregistrer une facture fournisseur</Link></HButton><HButton variant="primary" asChild><Link to="/billing/customer/new"><Plus size={14} />Nouvelle facture client</Link></HButton></>} />
    {query.isPending && <HLoadingIndicator label="Chargement de la facturation" />}{query.error && <p role="alert" className="field-error">{query.error.message}<HButton onClick={() => void query.refetch()}>Réessayer</HButton></p>}
    {query.data && (['customer', 'supplier'] as const).map((direction) => { const side = query.data[direction], customer = direction === 'customer'
      return <section className="billing-dashboard-section" key={direction}><HSectionHeading title={customer ? 'Clients' : 'Fournisseurs'} icon={customer ? CircleDollarSign : Receipt} actions={<HButton size="small" asChild><Link to={`/billing/${direction}`}>Toutes les factures<ArrowUpRight size={13} /></Link></HButton>} />
        <HSummaryCards label={customer ? 'Synthèse clients' : 'Synthèse fournisseurs'} onRetry={() => void query.refetch()} error={undefined} items={[
          { label: customer ? 'Brouillons' : 'À contrôler', icon: FilePenLine, tone: 'blue', count: side.drafts, detail: 'Pièces à traiter', href: `/billing/${direction}?status=draft` },
          { label: customer ? 'À encaisser' : 'À payer', icon: CircleDollarSign, tone: 'violet', count: side.due_count, value: formatAmount(side.due_amount, 'EUR'), detail: `${side.due_count} facture(s)`, href: `/billing/${direction}?status=unpaid` },
          { label: 'En retard', icon: Clock3, tone: 'amber', count: side.overdue_count, value: formatAmount(side.overdue_amount, 'EUR'), detail: `${side.overdue_count} facture(s)`, href: `/billing/${direction}?status=overdue` },
          { label: customer ? 'Encaissements du mois' : 'Paiements du mois', icon: Wallet, tone: 'green', count: 0, value: formatAmount(side.payments_month, 'EUR'), detail: 'Règlements nets des remboursements', href: `/billing/payments?direction=${direction}&status=validated` },
          { label: customer ? 'Reste à facturer' : 'Réceptions à rapprocher', icon: Receipt, tone: 'navy', count: side.pending_count ?? undefined, value: side.pending_amount === null ? '—' : formatAmount(side.pending_amount, 'EUR'), detail: side.pending_count === null ? 'Accès au module source nécessaire' : `${side.pending_count} commande(s) · HT`, href: `#billing-pending-${direction}` },
        ]} />
        <div className="billing-dashboard-tables"><section className="contact-panel"><HSectionHeading title="Prochaines échéances" icon={Clock3} /><HDataTable columnBorders data={side.deadlines} columns={[{ header: 'Facture', accessorKey: 'number' }, { header: 'Tiers', accessorKey: 'company_name' }, { header: 'Échéance', cell: ({ row }) => displayDate(row.original.due_date) }, { header: 'Solde', cell: ({ row }) => formatAmount(row.original.balance, 'EUR') }]} getRowLink={(item) => ({ href: `/billing/${item.kind}/${item.document_id}`, label: `Ouvrir ${item.number}` })} />{!side.deadlines.length && <p className="contact-muted">Aucune échéance ouverte.</p>}</section>
        <section className="contact-panel"><HSectionHeading title="Pièces à traiter" icon={FilePenLine} /><HDataTable columnBorders data={side.to_process} columns={[{ header: 'Pièce', cell: ({ row }) => row.original.supplier_invoice_number || row.original.title }, { header: 'Tiers', accessorKey: 'company_name' }, { header: 'TTC', cell: ({ row }) => formatAmount(row.original.total, 'EUR') }]} getRowLink={(item) => ({ href: `/billing/${item.kind}/${item.id}`, label: `Ouvrir ${item.title}` })} />{!side.to_process.length && <p className="contact-muted">Aucun brouillon à traiter.</p>}</section></div>
        <section id={`billing-pending-${direction}`} className="contact-panel"><HSectionHeading title={customer ? 'Commandes restant à facturer' : 'Commandes reçues restant à rapprocher'} icon={Receipt} /><HDataTable columnBorders data={side.pending} columns={[{ header: 'Commande', accessorKey: 'number' }, { header: 'Tiers', accessorKey: 'company_name' }, { header: 'Reste HT', cell: ({ row }) => formatAmount(row.original.amount, 'EUR') }, { header: 'Actions', cell: ({ row }) => access.canWrite && <HButton size="small" asChild><Link to={`/billing/${direction}/new?source_type=${row.original.source_type}&source_ids=${row.original.source_ids.join(',')}`}>Préparer</Link></HButton> }]} />{!side.pending.length && <p className="contact-muted">{side.pending_count === null ? 'Accès au module source nécessaire.' : 'Aucune source en attente.'}</p>}</section>
      </section>
    })}
  </div>
}
