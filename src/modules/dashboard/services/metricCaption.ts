import type { DashboardMetric } from '../schemas/dashboard'
export function metricCaption(metric: DashboardMetric | null | undefined, permission: boolean) {
  if (!permission) return 'Accès non autorisé'
  if (!metric) return 'Non disponible'
  const count = metric.values.reduce((sum, value) => sum + value.count, 0)
  return `${count} pièce${count > 1 ? 's' : ''}${metric.missing ? ` · ${metric.missing} sans ${metric.description.startsWith('Marge') ? 'coût historique' : 'date'}` : ''}`
}
