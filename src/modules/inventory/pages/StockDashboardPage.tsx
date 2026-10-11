import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { ArrowUpRight, ArrowLeftRight, Boxes, CalendarDays, ClipboardList, HardHat, LockKeyhole, Package, PackageCheck, Truck, Warehouse, Wallet } from 'lucide-react'
import { HPageBreadcrumb } from '../../../shared/ui/HPageBreadcrumb'
import { HPageHeader } from '../../../shared/ui/HPageHeader'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HSummaryCards } from '../../../shared/ui/HSummaryCards'
import { HButton } from '../../../shared/ui/HButton'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { HTag } from '../../../shared/ui/HTag'
import { HAffairTags } from '../../../shared/ui/HAffairTags'
import { formatAmount } from '../../../shared/formatters/money'
import { displayDate } from '../../../shared/time/zonedDate'
import { useStockAccess } from '../hooks/useStockAccess'
import { stockService } from '../services/StockService'
import { operationsService } from '../services/OperationsService'
import { valuationService } from '../services/ValuationService'
import { valuationMethods } from '../schemas/valuation'
import type { Operation } from '../schemas/operations'
import '../stock-operations.css'
import '../../../shared/dashboard.css'

function DashboardError({ error, retry }: { error: Error | null; retry: () => void }) {
  return error && <div role="alert" className="stock-dashboard-error field-error">{error.message}<HButton size="small" onClick={retry}>Réessayer</HButton></div>
}
function Browse({ href, label = 'Tout voir' }: { href: string; label?: string }) {
  return <HButton variant="ghost" size="small" asChild><Link to={href}>{label}<ArrowUpRight size={14} /></Link></HButton>
}
function PendingOperation({ item, inventory = false }: { item: Operation; inventory?: boolean }) {
  return <Link className="stock-pending-row" to={`/inventory/operations/${item.id}`}>
    <span className="stock-pending-identity"><strong>{inventory ? item.title || item.number : item.supplier_name || item.title || 'Entrée manuelle'}</strong><small>{item.number} · {item.warehouse_name}</small>{!inventory && <HAffairTags items={item.affair_tags} />}</span>
    <span className="stock-pending-date">{inventory && item.status === 'counting' ? <HTag tone="amber">Comptage en cours</HTag> : <><span>{!item.planned_date ? 'Non planifiée' : displayDate(item.planned_date)}</span><small>{inventory ? 'Date du comptage' : 'Réception souhaitée'}</small></>}</span><ArrowUpRight size={14} aria-hidden="true" />
  </Link>
}

export function StockDashboardPage() {
  const access = useStockAccess()
  const balances = useQuery({ queryKey: ['inventory', 'dashboard', 'balances'], queryFn: () => stockService.list({ q: '', product: '', location: '', page: 1, sort: '', group: '' }), enabled: access.canRead, retry: false })
  const operations = useQuery({ queryKey: ['inventory', 'operations', 'dashboard'], queryFn: () => operationsService.list({}), enabled: access.canRead, retry: false })
  const choices = useQuery({ queryKey: ['inventory', 'operation-choices'], queryFn: () => operationsService.choices(), enabled: access.canRead, retry: false })
  const receipts = useQuery({ queryKey: ['inventory', 'operations', 'dashboard-receipts'], queryFn: () => operationsService.list({ kind: 'IN', status: 'open', sort: 'planned_date' }), enabled: access.canRead, retry: false })
  const inventories = useQuery({ queryKey: ['inventory', 'operations', 'dashboard-inventories'], queryFn: () => operationsService.list({ kind: 'INV', status: 'open', sort: 'planned_date' }), enabled: access.canRead, retry: false })
  const counting = useQuery({ queryKey: ['inventory', 'operations', 'dashboard-counting'], queryFn: () => operationsService.list({ kind: 'INV', status: 'counting' }), enabled: access.canRead, retry: false })
  const valuation = useQuery({ queryKey: ['inventory', 'valuation-dashboard'], queryFn: () => valuationService.list(), enabled: access.canRead, retry: false })
  if (!access.canRead) return <p className="contact-muted">Accès au stock nécessaire.</p>
  return <div className="contact-directory stock-dashboard">
    <HPageBreadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Stock' }]} />
    <HPageHeader title="Stock" description="Les mouvements à traiter, les disponibilités et la valeur de vos entrepôts." actions={<HButton variant="ghost" asChild><Link to="/inventory/operations"><ArrowLeftRight size={14} />Opérations</Link></HButton>} />
    <HSummaryCards presentation="dashboard" label="Mouvements à traiter" items={([
      { key: 'IN', label: 'Réceptions', icon: PackageCheck, tone: 'blue', detail: 'À valider', href: 'kind=IN' },
      { key: 'OUT', label: 'Livraisons client', icon: Truck, tone: 'violet', detail: 'À expédier', href: 'kind=OUT&variant=delivery' },
      { key: 'PREP', label: 'Préparations chantier', icon: HardHat, tone: 'amber', detail: 'À préparer', href: 'kind=PREP' },
      { key: 'INT', label: 'Transferts internes', icon: ArrowLeftRight, tone: 'navy', detail: 'Brouillons et transit', href: 'kind=INT' },
    ] as const).map(({ key, href, ...item }) => ({ ...item, count: operations.data?.summary[key], href: `/inventory/operations?${href}&status=open` }))} error={operations.error?.message} onRetry={() => void operations.refetch()} />
    <div className="stock-dashboard-grid">
      <section className="contact-panel stock-dashboard-panel h-dashboard-card h-tone" data-tone="blue" aria-label="Réceptions en attente">
        <HSectionHeading title="Réceptions en attente" icon={PackageCheck} count={receipts.data?.totalItems} description="Les prochaines entrées à contrôler et à mettre en stock." actions={<Browse href="/inventory/operations?kind=IN&status=open&sort=planned_date" />} />
        {receipts.isPending && <HLoadingIndicator label="Chargement des réceptions" />}
        <DashboardError error={receipts.error} retry={() => void receipts.refetch()} />
        {receipts.data?.items.slice(0, 4).map((item) => <PendingOperation key={item.id} item={item} />)}
        {receipts.data?.totalItems === 0 && <div className="stock-dashboard-empty"><PackageCheck size={24} /><strong>Aucune réception en attente</strong><span>Les commandes fournisseurs validées apparaîtront ici.</span></div>}
      </section>
      <section className="contact-panel stock-dashboard-panel h-dashboard-card h-tone" data-tone="amber" aria-label="Inventaires en cours">
        <HSectionHeading title="Inventaires" icon={ClipboardList} count={inventories.data?.totalItems} description="Campagnes planifiées et comptages en cours." actions={<Browse href="/inventory/inventories?status=open" />} />
        {counting.data && counting.data.totalItems > 0 && <Link className="stock-counting-notice" to="/inventory/inventories?status=counting"><ClipboardList size={16} /><span><strong>{counting.data.totalItems}</strong> comptage(s) en cours</span><ArrowUpRight size={14} /></Link>}
        <DashboardError error={counting.error} retry={() => void counting.refetch()} />
        {inventories.isPending && <HLoadingIndicator label="Chargement des inventaires" />}
        <DashboardError error={inventories.error} retry={() => void inventories.refetch()} />
        {inventories.data?.items.slice(0, 3).map((item) => <PendingOperation key={item.id} item={item} inventory />)}
        {inventories.data?.totalItems === 0 && <div className="stock-dashboard-empty"><CalendarDays size={24} /><strong>Aucun inventaire à venir</strong><span>Planifiez un comptage annuel ou tournant.</span><Browse href="/inventory/inventories?view=calendar" label="Voir le calendrier" /></div>}
      </section>
      <section className="contact-panel stock-dashboard-panel h-dashboard-card h-tone" data-tone="green" aria-label="Vue d’ensemble du stock">
        <HSectionHeading title="Disponibilités" icon={Boxes} description="Nombre de produits distincts, toutes unités confondues." actions={<Browse href="/inventory/stock" label="Consulter le stock" />} />
        <div className="stock-availability-metrics">{([
          { key: 'all', label: 'Stockables', icon: Boxes }, { key: 'physical', label: 'En stock', icon: Package }, { key: 'reserved', label: 'Réservés', icon: LockKeyhole }, { key: 'available', label: 'Disponibles', icon: PackageCheck },
        ] as const).map(({ key, label, icon: Icon }) => <Link key={key} to={`/inventory/stock${key === 'all' ? '' : `?availability=${key}`}`}><Icon size={16} /><strong>{balances.data?.summary[key] ?? '—'}</strong><span>{label}</span></Link>)}</div>
        <DashboardError error={balances.error} retry={() => void balances.refetch()} />
        <div className="stock-dashboard-warehouses"><HSectionHeading title="Entrepôts" icon={Warehouse} />
          {choices.data?.warehouses.map((warehouse) => <Link className="stock-warehouse-link" key={warehouse.id} to={`/inventory/operations?warehouse=${warehouse.id}&status=open`}><span className="stock-warehouse-code">{warehouse.code}</span><span><strong>{warehouse.name}</strong><small>{choices.data.locations.filter((item) => item.warehouse === warehouse.id).length} emplacement(s)</small></span><ArrowUpRight size={14} /></Link>)}
          {choices.data?.warehouses.length === 0 && <p className="contact-muted">Aucun entrepôt actif.</p>}
          <DashboardError error={choices.error} retry={() => void choices.refetch()} />
        </div>
      </section>
      <section className="contact-panel stock-dashboard-panel stock-dashboard-value h-dashboard-card h-tone" data-tone="navy" aria-label="Valeur du stock">
        <HSectionHeading title="Valorisation du stock" icon={Wallet} description="Valeur d’achat HT, incluant les transferts en transit." />
        <span className="stock-value-method">{valuation.data ? valuationMethods[valuation.data.method] : '—'}</span>
        <strong className="stock-value-amount">{valuation.data ? formatAmount(valuation.data.value, valuation.data.currency) : '—'}</strong>
        {valuation.data && <><div className="stock-value-breakdown"><span>Dans les entrepôts</span><strong>{formatAmount(valuation.data.value - valuation.data.transit_value, valuation.data.currency)}</strong><span>En transit</span><strong>{formatAmount(valuation.data.transit_value, valuation.data.currency)}</strong></div>{valuation.data.incomplete > 0 && <p className="stock-value-notice">Valeur partielle : {valuation.data.incomplete} ouverture(s) de valorisation restent à valider.</p>}</>}
        <DashboardError error={valuation.error} retry={() => void valuation.refetch()} />
        <Browse href="/inventory/stock" label="Détail par produit" />
      </section>
    </div>
  </div>
}
