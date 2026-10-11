import type { DashboardMetric } from '../schemas/dashboard'
import { formatAmount } from '../../../shared/formatters/money'
export function MetricValue({ metric }: { metric: DashboardMetric | null | undefined }) {
  if (!metric) return <span aria-label="Donnée indisponible">—</span>
  if (!metric.values.length) return <span>0</span>
  return <span className="dashboard-metric-values" title={metric.description}>{metric.values.map((value) => <span key={value.currency}>{formatAmount(value.amount, value.currency)}{value.percent !== null && <small> · {value.percent.toLocaleString('fr-FR')} %</small>}</span>)}</span>
}
