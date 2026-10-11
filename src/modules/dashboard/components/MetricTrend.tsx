import type { DashboardMetric } from '../schemas/dashboard'
import { metricTrendGeometry } from '../services/metricTrendGeometry'
const steps = { day: 'par jour', week: 'par semaine', month: 'par mois' }
export function MetricTrend({ metric }: { metric: DashboardMetric | null | undefined }) {
  if (!metric?.trend) return null
  const trend = metric.trend
  const series = trend.series.length ? trend.series : [{ currency: '', values: trend.dates.map(() => 0) }]
  return <div className="dashboard-kpi-trend" aria-hidden="true" data-step={trend.step}>{series.map((series) => {
    const geometry = metricTrendGeometry(series.values)
    if (!geometry) return null
    return <svg key={series.currency} viewBox="0 0 320 100" preserveAspectRatio="none" data-currency={series.currency}>
      <title>{series.currency ? `${series.currency} · ` : ''}{steps[trend.step]} : {trend.dates.map((date, index) => `${date} : ${series.values[index]}`).join(' ; ')}</title>
      <line x1="0" x2="320" y1={geometry.baseline} y2={geometry.baseline} className="dashboard-kpi-trend-zero" />
      <path d={geometry.area} className="dashboard-kpi-trend-area" />
      <path d={geometry.path} className="dashboard-kpi-trend-line" />
    </svg>
  })}</div>
}
