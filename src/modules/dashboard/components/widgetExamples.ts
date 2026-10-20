import type { DashboardMetric } from '../schemas/dashboard'
import type { WidgetDataSpec } from '../schemas/widgetData'
import type { WidgetRecord } from '../services/widgetRecords'
import type { TimeOverview } from '../../time/schemas/time'
import type { LeaveCalendarData } from '../../leave/schemas/leave'
import type { DashboardFeedExamples } from './DashboardFeeds'

/** Fictional, local-only content for the widget picker; never used as business fallback. */
export const metricExample: DashboardMetric = {
  values: [{ currency: 'EUR', amount: 3200, count: 7, percent: null }], description: 'Données d’exemple', missing: 0,
  trend: { step: 'day', dates: ['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18'], series: [{ currency: 'EUR', values: [200, 350, 150, 700, 450, 800, 550] }] },
}
export const recordsExample: WidgetRecord[] = [
  { id: 'demo-1', reference: 'DEV-001', title: 'Aménagement studio', company: 'Studio Démo', amount: 2400, currency: 'EUR', status: 'Envoyé', tone: 'blue', href: '/sales/quotes/demo-1' },
  { id: 'demo-2', reference: 'DEV-002', title: 'Installation audio', company: 'Atelier Exemple', amount: 650, currency: 'EUR', status: 'Finalisé', tone: 'violet', href: '/sales/quotes/demo-2' },
  { id: 'demo-3', reference: 'DEV-003', title: 'Étude technique', company: 'Studio Démo', amount: 150, currency: 'EUR', status: 'Brouillon', tone: 'navy', href: '/sales/quotes/demo-3' },
]
export function exampleRecords(source: WidgetDataSpec['source']): WidgetRecord[] {
  const details = {
    opportunities: { prefix: 'AFF', status: 'En cours', tone: 'blue' as const },
    quotes: { prefix: 'DEV', status: 'Envoyé', tone: 'blue' as const },
    orders: { prefix: 'CMD', status: 'Confirmée', tone: 'violet' as const },
    invoices: { prefix: 'FAC', status: 'Comptabilisée', tone: 'green' as const },
  }[source]
  return recordsExample.map((record, index) => ({ ...record, reference: `${details.prefix}-00${index + 1}`, status: details.status, tone: details.tone }))
}
export const timeExample: TimeOverview = {
  today: '2026-10-18', area: 'review', view: 'month', start: '2026-10-01', end: '2026-10-31', page: 1, totalPages: 1, totalItems: 2,
  summary: { minutes: 3600, submitted: 1, validated: 2, rejected: 0, missing: 1 },
  periods: [{ key: '2026-10-05', start: '2026-10-05', end: '2026-10-11' }, { key: '2026-10-12', start: '2026-10-12', end: '2026-10-18' }],
  items: ['Camille Martin', 'Alex Bernard'].map((employee_name, index) => ({ employee: `demo-${index}`, employee_name, has_photo: false, photo_revision: '', team_name: 'Équipe Démo', work_type: 'be', days: [], total_minutes: index ? 1200 : 2400, capacity_minutes: null,
    cells: ['2026-10-05', '2026-10-12'].map((key, column) => ({ key, minutes: index && column ? null : 1200, capacity_minutes: null, status: index && column ? 'missing' : column ? 'submitted' : 'validated', validated_weeks: column ? 0 : 1, total_weeks: 1, missing_weeks: index && column ? 1 : 0, sheets: [] })),
  })),
}
export const leaveExample: LeaveCalendarData = {
  scope: 'team', can_company: false, has_team: true, page: 1, totalPages: 1, totalItems: 2,
  employees: [{ id: 'demo-0', name: 'Camille Martin', has_photo: false, photo_revision: '' }, { id: 'demo-1', name: 'Alex Bernard', has_photo: false, photo_revision: '' }],
  days: Array.from({ length: 14 }, (_, index) => { const date = new Date(Date.UTC(2026, 9, 5 + index)), weekend = date.getUTCDay() === 0 || date.getUTCDay() === 6; return { date: date.toISOString().slice(0, 10), weekend, working: !weekend, holiday: '', absent: !weekend && index < 5 ? 1 : 0, pending: !weekend && index >= 7 && index < 10 ? 1 : 0 } }),
  items: [{ id: 'leave-demo-0', employee: 'demo-0', employee_name: 'Camille Martin', start_date: '2026-10-05', end_date: '2026-10-09', start_half: 'am', end_half: 'pm', duration: 5, type_label: 'Congés payés', pending: false, status: 'approved', href: '' }, { id: 'leave-demo-1', employee: 'demo-1', employee_name: 'Alex Bernard', start_date: '2026-10-12', end_date: '2026-10-14', start_half: 'am', end_half: 'pm', duration: 3, type_label: 'Récupération', pending: true, status: 'submitted', href: '' }],
}
export const feedsExample: DashboardFeedExamples = {
  planning: [{ id: 'demo-meeting', title: 'Préparer la réunion de lancement', context: 'Affaire Démo · Studio Démo', start: '2026-10-20T09:00:00Z', allDay: false, kind: 'Tâche', kindCode: 'task', tone: undefined, color: undefined, detail: 'Tâche', href: '/calendar' }, { id: 'demo-visit', title: 'Visite technique', context: 'Affaire Démo · Atelier Exemple', start: '2026-10-22T12:00:00Z', allDay: false, kind: 'Visite', kindCode: 'visit', tone: 'blue', color: undefined, detail: 'Visite', href: '/calendar' }],
  activity: { items: [{ id: 'demo-note', type: 'note', body: 'Un nouveau commentaire sur le devis', author: 'Camille Martin', created: '2026-10-20T09:00:00Z', source: 'DEV-001 · Studio Démo', href: '/sales/quotes/demo-1' }, { id: 'demo-file', type: 'document', body: 'Proposition envoyée au client', author: 'Alex Bernard', created: '2026-10-19T14:00:00Z', source: 'DEV-002 · Atelier Exemple', href: '/sales/quotes/demo-2' }] },
}
