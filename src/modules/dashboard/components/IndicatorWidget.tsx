import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { DashboardMetric } from '../schemas/dashboard'
import { useQuery } from '@tanstack/react-query'
import { ChartNoAxesCombined, ShoppingCart, Receipt, Percent } from 'lucide-react'
import { HButton } from '../../../shared/ui/HButton'
import { HBadge } from '../../../shared/ui/HBadge'
import { hasPermission, type HorizonUser } from '../../../core/auth/types/session'
import { dashboardService } from '../services/DashboardService'
import { widgetRange, type WidgetRange } from '../services/widgetRecords'
import type { DashboardWidget } from '../schemas/layouts'
import { metricCaption } from '../services/metricCaption'
import { MetricTrend } from './MetricTrend'
import { MetricValue } from './MetricValue'
const indicators = [
  { key: 'forecast', permission: 'crm.read', label: 'Chiffre d’affaires prévu', icon: ChartNoAxesCombined, caption: 'Opportunités commerciales' },
  { key: 'ordered', permission: 'sales.read', label: 'Commandé', icon: ShoppingCart, caption: 'Commandes clients' },
  { key: 'invoiced', permission: 'billing.read', label: 'Facturé', icon: Receipt, caption: 'Factures clients' },
  { key: 'margin', permission: 'sales.read', label: 'Marge prévisionnelle', icon: Percent, caption: 'Pilotage des affaires' },
] as const
export function IndicatorWidget({ widget, range: global, user }: { widget: DashboardWidget; range: WidgetRange; user: HorizonUser | undefined }) {
  const range = widgetRange(widget.config.period, global) || global
  const indicator = indicators.find((item) => item.key === widget.type)
  const can = (permission: string) => Boolean(user && hasPermission(user, permission))
  const query = useQuery({ queryKey: ['dashboard', 'metrics', user?.id, range.start, range.end], queryFn: () => dashboardService.metrics(range.start, range.end), enabled: Boolean(user) && widget.type !== 'invoiced' && (indicator ? can(indicator.permission) : ['crm.read', 'sales.read', 'purchasing.read'].some(can)), staleTime: 60_000, refetchOnMount: 'always', retry: false })
  const metricData = query.data
  if (indicator) {
    const { key, permission, label, icon: Icon, caption } = indicator
    return <MetricCard title={widget.config.title || label} icon={Icon} metric={key === 'invoiced' ? null : metricData?.[key]} caption={caption} detail={`${range.label} · ${key === 'invoiced' ? 'À venir' : query.isPending && can(permission) ? 'Chargement…' : metricCaption(metricData?.[key], can(permission))}`}>
      {query.error && <p role="alert" className="field-error">{query.error.message}<HButton size="small" onClick={() => void query.refetch()}>Réessayer</HButton></p>}
    </MetricCard>
  }

  return <EconomicCard title={widget.config.title || 'Pilotage économique'} period={range.label} forecast={metricData?.forecast} committed={metricData?.committed}>
    {query.error && <p className="field-error" role="alert">{query.error.message}<HButton size="small" onClick={() => void query.refetch()}>Réessayer</HButton></p>}
  </EconomicCard>
}
export function MetricCard({ title, icon: Icon, metric, caption, detail, children }: { title: string; icon: LucideIcon; metric: DashboardMetric | null | undefined; caption: string; detail: string; children?: ReactNode }) {
  return <section className="panel kpi h-dashboard-card h-tone" data-tone="navy" aria-label={title}>
    <MetricTrend metric={metric} />
    <div className="kpi__label"><Icon className="h-dashboard-icon" size={20} aria-hidden="true" /><span>{title}</span></div>
    <strong className="kpi__value"><MetricValue metric={metric} /></strong>
    <div className="kpi__caption">{caption}<span>{detail}</span></div>{children}
  </section>
}
export function EconomicCard({ title, period, forecast, committed, children }: { title: string; period: string; forecast: DashboardMetric | null | undefined; committed: DashboardMetric | null | undefined; children?: ReactNode }) {
  return <section className="panel economic-panel h-dashboard-card h-tone" data-tone="navy" aria-label={title}>
    <div className="panel-heading"><h2><ChartNoAxesCombined size={17} />{title}</h2><HBadge>{period}</HBadge></div>{children}
    <div className="economic-flow">{[{ label: 'Prévu', metric: forecast }, { label: 'Engagé', metric: committed }, { label: 'Réalisé', metric: null }, { label: 'Facturé', metric: null }, { label: 'Payé', metric: null }].map(({ label, metric }, index) => <div key={label} title={metric?.description || 'Données non raccordées'}><span className="economic-flow__number">0{index + 1}</span><strong>{label}</strong><span className="economic-flow__value"><MetricValue metric={metric} /></span></div>)}</div>
    <p className="economic-note">Prévu : estimations CRM à la date prévue. Engagé : achats HT à leur validation. Réalisé, facturé et payé restent à raccorder.</p>
  </section>
}
