import { useState, useSyncExternalStore } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChartNoAxesCombined, ShoppingCart, Receipt, Percent, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { HPageHeader } from '../../../shared/ui/HPageHeader'
import { HBadge } from '../../../shared/ui/HBadge'
import { HButton } from '../../../shared/ui/HButton'
import { dashboardPeriodRange, parisToday, type DashboardPeriod } from '../services/dashboardPeriod'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { dashboardService } from '../services/DashboardService'
import { DashboardFeeds } from '../components/DashboardFeeds'
import { metricCaption } from '../services/metricCaption'
import { MetricTrend } from '../components/MetricTrend'
import { MetricValue } from '../components/MetricValue'
import { BusinessCarousel } from '../components/BusinessCarousel'
import '../../../shared/dashboard.css'

const indicators = [
  { key: 'forecast', permission: 'crm.read', label: 'Chiffre d’affaires prévu', icon: ChartNoAxesCombined, caption: 'Opportunités commerciales', tone: 'navy' },
  { key: 'ordered', permission: 'sales.read', label: 'Commandé', icon: ShoppingCart, caption: 'Commandes clients', tone: 'navy' },
  { key: 'invoiced', permission: 'billing.read', label: 'Facturé', icon: Receipt, caption: 'Factures clients', tone: 'navy' },
  { key: 'margin', permission: 'sales.read', label: 'Marge prévisionnelle', icon: Percent, caption: 'Pilotage des affaires', tone: 'navy' },
] as const

export function DashboardPage() {
  const [{ period, anchor }, setSelection] = useState<{ period: DashboardPeriod; anchor: string }>(() => ({ period: 'month', anchor: parisToday() }))
  const range = dashboardPeriodRange(period, anchor)
  const setPeriod = (value: DashboardPeriod, date = anchor) => setSelection({ period: value, anchor: date })
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const user = session.status === 'authenticated' ? session.user : undefined
  const can = (permission: string) => Boolean(user && hasPermission(user, permission))
  const metrics = useQuery({ queryKey: ['dashboard', 'metrics', user?.id, range.start, range.end], queryFn: () => dashboardService.metrics(range.start, range.end), enabled: Boolean(user) && ['crm.read', 'sales.read', 'purchasing.read'].some(can), staleTime: 30_000, refetchOnMount: 'always', refetchInterval: 60_000, retry: false })
  const date = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'Europe/Paris' }).format(new Date())

  return <div className="horizon-dashboard">
    <HPageHeader title="Dashboard" titleAccessory={<span className="dashboard-date"><CalendarDays size={15} aria-hidden="true" />{date}</span>} actionsPlacement="inline" actions={<div className="dashboard-period-toolbar">
      <div className="dashboard-period-controls">
      <div className="contact-view-switch" role="group" aria-label="Période des indicateurs et du pilotage">{([{ value: 'month', label: 'Mois' }, { value: 'quarter', label: 'Trimestre' }, { value: 'year', label: 'Année' }] as const).map(({ value, label }) => <HButton key={value} size="small" variant="ghost" aria-pressed={period === value} onClick={() => setPeriod(value)}>{label}</HButton>)}</div>
      <div className="dashboard-period-navigation" role="group" aria-label="Navigation temporelle">
        <HButton size="icon" variant="ghost" aria-label="Période précédente" title="Période précédente" onClick={() => setPeriod(period, range.previous)}><ChevronLeft size={15} /></HButton>
        <span aria-live="polite" title={range.description}>{range.label}</span>
        <HButton size="icon" variant="ghost" aria-label="Période suivante" title="Période suivante" onClick={() => setPeriod(period, range.next)}><ChevronRight size={15} /></HButton>
      </div>
      </div>
    </div>} />
    <p className="dashboard-period-caption">Indicateurs et pilotage · {range.description}</p>
    {metrics.isError && <div className="dashboard-data-error" role="alert"><span>{metrics.error.message}</span><HButton size="small" onClick={() => void metrics.refetch()}>Réessayer</HButton></div>}
    <div className="kpi-grid">{indicators.map(({ key, permission, label, icon: Icon, caption, tone }) => (

      <section className="panel kpi h-dashboard-card h-tone" data-tone={tone} key={label} aria-label={label}>
        <MetricTrend metric={key === 'invoiced' ? null : metrics.data?.[key]} />
        <div className="kpi__label"><Icon className="h-dashboard-icon" size={20} aria-hidden="true" /><span>{label}</span></div>
        <strong className="kpi__value"><MetricValue metric={key === 'invoiced' ? null : metrics.data?.[key]} /></strong>
        <div className="kpi__caption">{caption}<span>{key === 'invoiced' ? 'À venir' : metrics.isPending && can(permission) ? 'Chargement…' : metricCaption(metrics.data?.[key], can(permission))}</span></div>
      </section>
    ))}</div>
    <div className="dashboard-columns">
      <div className="dashboard-primary">
        <BusinessCarousel />
        <section className="panel economic-panel h-dashboard-card h-tone" data-tone="navy" aria-labelledby="economic-title">
          <div className="panel-heading"><h2 id="economic-title"><ChartNoAxesCombined size={17} aria-hidden="true" />Pilotage économique</h2><HBadge>{range.label}</HBadge></div>
          <div className="economic-flow">{[{ label: 'Prévu', metric: metrics.data?.forecast }, { label: 'Engagé', metric: metrics.data?.committed }, { label: 'Réalisé', metric: null }, { label: 'Facturé', metric: null }, { label: 'Payé', metric: null }].map(({ label, metric }, index) => <div key={label} title={metric?.description || 'Données non raccordées'}><span className="economic-flow__number">0{index + 1}</span><strong>{label}</strong><span className="economic-flow__value"><MetricValue metric={metric} /></span></div>)}</div>
          <p className="economic-note">Prévu : estimations CRM à la date prévue. Engagé : achats HT à leur validation. Réalisé, facturé et payé seront raccordés aux modules correspondants.</p>
        </section>
      </div>
      <DashboardFeeds userId={user?.id || ''} canCalendar={can('crm.read') || can('calendar.read')} canActivity={['contacts.read', 'crm.read', 'sales.read', 'inventory.read', 'purchasing.read', 'billing.read', 'expenses.read', 'leave.read'].some(can)} />
    </div>
  </div>
}
