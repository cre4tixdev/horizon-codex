import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { ChartBar, Clock3, ShoppingCart, PackageCheck, CircleDollarSign, ShieldCheck } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { HButton } from '../../../shared/ui/HButton'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { HTag } from '../../../shared/ui/HTag'
import { formatAmount } from '../../../shared/formatters/money'
import { analysisService } from '../services/AnalysisService'
import { useAnalysisAccess } from '../hooks/useAnalysisAccess'
import type { AnalysisAccount } from '../schemas/analysis'
export function AffairAnalysis({ opportunity, quote }: { opportunity?: string; quote?: string }) {
  const access = useAnalysisAccess()
  const source = quote ? { quote } : { opportunity: opportunity || '' }
  const query = useQuery({ queryKey: ['analysis', access.accessKey, source], queryFn: () => analysisService.read(source), enabled: access.canRead && Boolean(opportunity || quote), retry: false })
  if (!access.canRead) return null
  if (query.error) return <p role="alert" className="field-error">{query.error.message}<HButton size="small" onClick={() => void query.refetch()}>Réessayer</HButton></p>
  if (!query.data) return <HLoadingIndicator label="Chargement de l’analyse" />
  const data = query.data, f = data.totals.financial
  const amount = (value: number | null | undefined) => value == null ? '—' : formatAmount(value, data.currency)
  const percent = (value: number | null | undefined) => value == null ? '—' : `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value)} %`
  const columns: ColumnDef<AnalysisAccount>[] = [
    { id: 'code', header: 'Affectation', cell: ({ row }) => row.original.quote ? <span><HTag tone="navy">{row.original.code}</HTag>{access.canReadSales ? <Link to={`/sales/quotes/${row.original.quote}`}>{row.original.label}</Link> : row.original.label}{!row.original.confirmed && <small className="contact-muted"> · Hors commande active</small>}</span> : <span><HTag tone="navy">{row.original.code}</HTag>Coûts communs de l’affaire</span> },
    { id: 'delivery', header: 'Lignes livrées', cell: ({ row }) => `${row.original.delivered_lines} / ${row.original.item_lines}` },
    ...(data.capabilities.financial ? [
      { id: 'revenue', header: 'Commandé HT', cell: ({ row }) => amount(row.original.financial?.revenue) },
      { id: 'cost', header: 'Coût prévu HT', cell: ({ row }) => amount(row.original.financial?.planned_cost) },
      { id: 'margin', header: 'Marge prévue', cell: ({ row }) => <span>{amount(row.original.financial?.planned_margin)}<small className="contact-muted"> · {percent(row.original.financial?.planned_margin_percent)}</small></span> },
      { id: 'purchases', header: 'Achats engagés HT', cell: ({ row }) => amount(row.original.financial?.purchases_committed) },
      { id: 'stock', header: 'Stock consommé HT', cell: ({ row }) => amount(row.original.financial?.stock_consumed) },
    ] satisfies ColumnDef<AnalysisAccount>[] : []),
  ]
  return <section className="affair-analysis"><HSectionHeading title={quote ? `Analyse de la commande ${data.accounts[0]?.code || ''}` : `Analyse de l’affaire ${data.root.code}`} icon={ChartBar} actions={quote && access.canReadCrm ? <HButton size="small" asChild><Link to={`/crm/opportunities/${data.root.opportunity}`} state={{ crmSection: 'analysis' }}>Analyse globale</Link></HButton> : undefined} /><p className="contact-muted">{data.root.client} · {data.root.label}</p>
    <div className="analysis-indicators">
      <div className="contact-panel analysis-indicator"><HSectionHeading title="Commande Client" icon={CircleDollarSign} /><strong>{f ? amount(f.revenue) : data.accounts.filter((account) => account.confirmed).length}</strong><span className="analysis-estimate" title={quote ? 'Estimation globale de l’affaire' : 'Montant estimé'}>{amount(f?.estimated_revenue)}</span>{f && <AnalysisHistogram groups={[{ bars: [{ label: quote ? 'Estimé affaire' : 'Estimé', value: f.estimated_revenue ?? null, display: amount(f.estimated_revenue), tone: 'planned' }, { label: 'Commandé', value: f.revenue, display: amount(f.revenue), tone: 'actual' }] }]} />}</div>
      <div className="contact-panel analysis-indicator"><HSectionHeading title="Achats" icon={ShoppingCart} /><strong>{amount(f?.purchases_committed)}</strong><span className="analysis-estimate" title="Coût prévisionnel">{amount(f?.planned_cost)}</span>{f && <AnalysisHistogram groups={[{ bars: [{ label: 'Prévu', value: f.planned_cost, display: amount(f.planned_cost), tone: 'planned' }, { label: 'Engagé', value: f.purchases_committed, display: amount(f.purchases_committed), tone: 'actual' }] }]} />}</div>
      <div className="contact-panel analysis-indicator"><HSectionHeading title="Livraison" icon={PackageCheck} /><strong>{data.totals.delivered_lines}</strong><span className="analysis-estimate" title="Lignes à livrer">{data.totals.item_lines}</span><AnalysisHistogram groups={[{ bars: [{ label: 'À livrer', value: data.totals.item_lines, display: String(data.totals.item_lines), tone: 'planned' }, { label: 'Livré', value: data.totals.delivered_lines, display: String(data.totals.delivered_lines), tone: 'actual' }] }]} /></div>
      <div className="contact-panel analysis-indicator"><HSectionHeading title="Heures" icon={Clock3} /><strong>{data.coverage.time ? hours(data.totals.hours.be.actual_minutes + data.totals.hours.production.actual_minutes) : '—'}</strong><span className="analysis-estimate" title="Heures vendues non raccordées">—</span><AnalysisHistogram groups={(['be', 'production'] as const).map((work) => ({ label: work === 'be' ? 'BE' : 'PROD', bars: [{ label: 'Vendues', value: null, display: '—', tone: 'planned' }, { label: 'Réalisées', value: (work === 'production' ? data.coverage.time_production ?? data.coverage.time : data.coverage.time_be ?? data.coverage.time) ? data.totals.hours[work].actual_minutes : null, display: (work === 'production' ? data.coverage.time_production ?? data.coverage.time : data.coverage.time_be ?? data.coverage.time) ? hours(data.totals.hours[work].actual_minutes) : '—', tone: 'actual' }] }))} /></div>
      <div className="contact-panel analysis-indicator analysis-indicator--margin"><HSectionHeading title="Marge à date" icon={ChartBar} /><strong>—</strong><span className="analysis-estimate" title="Marge prévisionnelle">{amount(f?.planned_margin)}</span>{f && <AnalysisHistogram groups={[{ bars: [{ label: 'Prévue', value: f.planned_margin, display: amount(f.planned_margin), tone: 'planned' }, { label: 'À date', value: null, display: '—', tone: 'actual' }] }]} />}</div>
    </div>
    <HSectionHeading title="Synthèse par commande et coûts communs" icon={ChartBar} />
    <HDataTable columnBorders columnAlignments={{ delivery: 'center', revenue: 'right', cost: 'right', margin: 'right', purchases: 'right', stock: 'right' }} columns={columns} data={data.accounts} />
    <section className="analysis-hours"><HSectionHeading title="Heures BE et PROD" icon={Clock3} />
      <HDataTable columnBorders columnAlignments={{ be_planned: 'right', be_actual: 'right', production_planned: 'right', production_actual: 'right', labor_cost: 'right' }} data={[...data.accounts, { ...data.totals, id: 'total-hours', code: 'Total', label: '', quote: '' }]} columns={[
        { id: 'account', header: 'Affectation', cell: ({ row }) => row.original.id === 'total-hours' ? <strong>Total {quote ? 'commande' : 'affaire'}</strong> : <span><HTag tone="navy">{row.original.code}</HTag>{row.original.quote ? row.original.label : 'Coûts communs de l’affaire'}</span> },
        { id: 'be_planned', header: 'BE · Prévu', cell: ({ row }) => data.coverage.planning ? hours(row.original.hours.be.planned_minutes) : '—' },
        { id: 'be_actual', header: 'BE · Réalisé', cell: ({ row }) => (data.coverage.time_be ?? data.coverage.time) ? hours(row.original.hours.be.actual_minutes) : '—' },
        { id: 'production_planned', header: 'PROD · Prévu', cell: ({ row }) => data.coverage.planning ? hours(row.original.hours.production.planned_minutes) : '—' },
        { id: 'production_actual', header: 'PROD · Réalisé', cell: ({ row }) => (data.coverage.time_production ?? data.coverage.time) ? hours(row.original.hours.production.actual_minutes) : '—' },
        ...(f ? [{ id: 'labor_cost', header: 'Coût des temps validés', cell: ({ row }: { row: { original: AnalysisAccount } }) => amount(row.original.financial?.actual_labor_cost) }] : []),
      ]} />
      <p className="contact-muted">{data.coverage.time ? `Heures réalisées validées uniquement. En attente de validation : BE ${hours(data.totals.hours.be.pending_minutes)} · PROD ${hours(data.totals.hours.production.pending_minutes)}.` : 'La source TimeReport n’est pas encore disponible dans Horizon.'}{data.coverage.time_production === false && ' Les temps PROD OnSite ne sont pas encore raccordés.'}{!data.coverage.planning && ' Le planning prévisionnel reste à raccorder.'}</p>
    </section>
    {!f && <p className="contact-muted"><ShieldCheck size={13} /> Suivi opérationnel. Les montants nécessitent le droit Analyse financière.</p>}
    <p className="contact-muted analysis-coverage">Coûts des temps : snapshots à validation, montant indisponible si un taux manque ou diffère de la devise de l’affaire. Frais et facturation : raccordement à venir. La marge prévue porte sur le coût prévu des lignes des commandes ; une marge réelle complète sera disponible après ces raccordements.{data.coverage.stock_currency_mismatch && ' Valorisation du stock dans une autre devise : montant non consolidé.'}</p>
  </section>
}

function hours(minutes: number) { return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(minutes / 60)} h` }

type HistogramBar = { label: string; value: number | null; display: string; tone: 'planned' | 'actual' }
function AnalysisHistogram({ groups }: { groups: { label?: string; bars: HistogramBar[] }[] }) {
  const values = groups.flatMap((group) => group.bars.map((bar) => bar.value ?? 0))
  const min = Math.min(0, ...values), max = Math.max(0, ...values), range = max - min || 1
  const y = (value: number) => 46 - (value - min) / range * 42
  return <div className="analysis-histogram">{groups.map((group, index) => {
    const target = group.bars.find((bar) => bar.tone === 'planned')
    const reference = target?.value
    return <div className="analysis-histogram-group" key={group.label || index}>
    {group.label && <span className="analysis-histogram-group-label">{group.label}</span>}
    <div className="analysis-histogram-bars">{group.bars.filter((bar) => bar.tone === 'actual').map((bar) => <div className="analysis-histogram-bar" key={bar.label}>
      <svg viewBox="0 0 40 48" preserveAspectRatio="none" role="img" aria-label={`${group.label ? `${group.label} · ` : ''}${bar.label} : ${bar.display}`}>
        <rect x="9" y="4" width="22" height="42" rx="3" className="analysis-histogram-track" />
        <line x1="0" x2="40" y1={y(0)} y2={y(0)} className="analysis-histogram-baseline" />
        {bar.value != null && bar.value !== 0 && <rect className={`analysis-histogram-fill analysis-histogram-fill--${bar.tone}`} x="9" width="22" y={Math.min(y(0), y(bar.value))} height={Math.abs(y(bar.value) - y(0))} rx="3" />}
        {bar.tone === 'actual' && bar.value != null && reference != null && reference >= 0 && bar.value > reference && <rect className="analysis-histogram-overflow" x="9" width="22" y={y(bar.value)} height={y(reference) - y(bar.value)} rx="3"><title>Dépassement du prévisionnel : {bar.display}</title></rect>}
        {reference != null && reference >= 0 && <g className="analysis-histogram-reference" data-exceeded={bar.value != null && reference >= 0 && bar.value > reference}><line x1="3" x2="37" y1={y(reference)} y2={y(reference)} /><path d={`M0,${y(reference) - 3} L4,${y(reference)} L0,${y(reference) + 3} Z`} /><title>Prévisionnel : {target?.display}</title></g>}
      </svg>
    </div>)}</div>
  </div>})}</div>
}
