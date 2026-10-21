import { ChartNoAxesCombined, ShoppingCart, Receipt, Percent } from 'lucide-react'
import type { DashboardWidget } from '../schemas/layouts'
import { widgetCatalog } from '../schemas/layouts'
import { shortcutCatalog } from '../schemas/shortcuts'
import { metricExample, exampleRecords, timeExample, leaveExample, feedsExample } from './widgetExamples'
import { dashboardPeriodRange } from '../services/dashboardPeriod'
import { MetricCard, EconomicCard } from './IndicatorWidget'
import { WidgetRecordsView } from './WidgetRecordsView'
import { BusinessCarousel } from './BusinessCarousel'
import { DashboardFeeds } from './DashboardFeeds'
import { WidgetFrame, TimeWidgetTable, LeaveWidgetTimeline, ShortcutLinks, ApprovalLink } from './WorkspaceWidgets'
const metricIcons = { forecast: ChartNoAxesCombined, ordered: ShoppingCart, invoiced: Receipt, margin: Percent }
function PreviewContent({ widget }: { widget: DashboardWidget }) {
  const title = widgetCatalog[widget.type].label
  if (widget.type === 'forecast' || widget.type === 'ordered' || widget.type === 'invoiced' || widget.type === 'margin') {
    const Icon = metricIcons[widget.type]
    return <MetricCard title={title} icon={Icon} metric={widget.type === 'invoiced' ? null : metricExample} caption={widget.type === 'invoiced' ? 'Indicateur à raccorder' : 'Exemple d’évolution sur la période'} detail="Octobre 2026 · exemple" />
  }
  if (widget.type === 'economic') return <EconomicCard title={title} period="Octobre 2026" forecast={metricExample} committed={metricExample} />
  if (widget.type === 'records') return <WidgetRecordsView data={{ ...widget.config.data, title: 'Devis à suivre', source: 'quotes' }} items={exampleRecords('quotes')} totalItems={3} />
  if (widget.type === 'business') return <BusinessCarousel instanceId="catalog-preview" config={widget.config} range={dashboardPeriodRange('month', '2026-10-20')} user={undefined} editing renderPage={(data) => <WidgetRecordsView data={data} items={exampleRecords(data.source)} totalItems={3} embedded />} />
  if (widget.type === 'time') return <WidgetFrame title={title}><TimeWidgetTable data={timeExample} /></WidgetFrame>
  if (widget.type === 'leave') return <WidgetFrame title={title}><LeaveWidgetTimeline result={leaveExample} first="2026-10-05" /></WidgetFrame>
  if (widget.type === 'shortcuts') return <WidgetFrame title={title}><ShortcutLinks links={widget.config.links.map((key) => shortcutCatalog[key])} /></WidgetFrame>
  if (widget.type === 'approvals') return <WidgetFrame title={title}>{[{ label: 'Congés', count: 2, period: 'Année en cours' }, { label: 'Notes de frais', count: 3, period: 'Toutes périodes' }, { label: 'TimeReport', count: 4, period: 'Mois en cours' }].map((item) => <div key={item.label} className="dashboard-approval-source"><ApprovalLink {...item} href="/" /></div>)}</WidgetFrame>
  if (widget.type !== 'planning' && widget.type !== 'activity') return null
  return <DashboardFeeds kind={widget.type} userId="catalog-preview" canCalendar canActivity preview={feedsExample} />
}
export function WidgetPreview({ widget }: { widget: DashboardWidget }) {
  return <div className="horizon-dashboard dashboard-catalog-preview" onClickCapture={(event) => { if (event.target instanceof Element && event.target.closest('a')) event.preventDefault() }}>
    <div className="dashboard-widget" data-kind={widget.type} data-compact={widget.width <= 3 || widget.height === 1} style={{ height: Math.max(170, Math.min(400, widget.height * 80 + (widget.height - 1) * 14)) }}>
      <div className="dashboard-widget-content"><PreviewContent widget={widget} /></div>
    </div>
  </div>
}
