import type { TagTone } from '../../../shared/schemas/tagTone'
import { crmService } from '../../crm'
import { salesService } from '../../sales'
import { billingService } from '../../billing/services/BillingService'
import { crmRecordHref } from '../../crm/schemas/opportunities'
import { quoteStatusLabels, quoteStatusTones } from '../../sales/schemas/quotes'
import { states as billStates } from '../../billing/schemas/billing'
import type { WidgetDataSpec } from '../schemas/widgetData'
import { dashboardPeriodRange, parisToday } from './dashboardPeriod'

export type WidgetRange = ReturnType<typeof dashboardPeriodRange>
export function widgetRange(period: WidgetDataSpec['period'], global: WidgetRange): WidgetRange | null {
  return period === 'all' ? null : period === 'dashboard' ? global : dashboardPeriodRange(period, parisToday())
}
export type WidgetRecord = { id: string; title: string; reference: string; company: string; amount: number; currency: string; status: string; tone?: TagTone; color?: string | undefined; href: string }
export function widgetRecordQuery(data: WidgetDataSpec, userId: string, global: WidgetRange, page = 1) {
  const range = widgetRange(data.period, global)
  return { q: data.search, company: data.company, ...(range ? { from: range.start, to: range.end } : {}), ...(data.scope === 'own' ? { owner: userId } : {}), page, perPage: data.limit }
}
export function widgetRecordHref(data: WidgetDataSpec, userId: string, global: WidgetRange) {
  const query = Object.fromEntries(Object.entries(widgetRecordQuery(data, userId, global)).filter(([key]) => !['page', 'perPage'].includes(key)))
  if (query.from && query.to) { query.date_range = `${query.from}:${query.to}`; delete query.from; delete query.to }
  const base = data.source === 'opportunities' ? '/crm' : data.source === 'invoices' ? '/billing/customer' : '/sales/quotes'
  const values = data.source === 'opportunities' || data.source === 'invoices' ? { ...query, status: data.status } : data.source === 'orders' ? { ...query, kind: 'order', order_status: data.status } : { ...query, kind: 'quote', status: data.status }
  return `${base}?${new URLSearchParams(Object.fromEntries(Object.entries(values).filter(([, value]) => value !== '').map(([key, value]) => [key, String(value)])))}`
}
export async function loadWidgetRecords(data: WidgetDataSpec, userId: string, global: WidgetRange, page: number): Promise<{ items: WidgetRecord[]; totalItems: number; totalPages: number }> {
  const query = widgetRecordQuery(data, userId, global, page)
  if (data.source === 'opportunities') {
    const result = await crmService.list({ ...query, search: data.search, archived: false, status: data.status, owner: data.scope === 'own' ? userId : '', sort: '-created' })
    return { ...result, items: result.items.map((item) => ({ id: item.id, title: item.title, reference: item.opportunity_number, company: item.expand?.company?.name || '', amount: item.estimated_value, currency: item.currency, status: item.expand?.stage?.label || '', tone: item.expand?.stage?.tone || 'navy', color: item.expand?.stage?.color || undefined, href: crmRecordHref(item) })) }
  }
  if (data.source === 'invoices') {
    const result = await billingService.list({ ...query, kind: 'customer', status: data.status, sort: '-created' })
    return { ...result, items: result.items.map((item) => ({ id: item.id, title: item.title, reference: item.number || 'Brouillon', company: item.company_name, amount: item.subtotal, currency: item.currency, status: billStates[item.status], tone: item.status === 'validated' ? 'green' : item.status === 'cancelled' ? 'pink' : 'navy', href: `/billing/customer/${item.id}` })) }
  }
  const result = await salesService.list({ ...query, opportunity: '', kind: data.source === 'orders' ? 'order' : 'quote', status: data.source === 'orders' ? '' : data.status, order_status: data.source === 'orders' ? data.status : '', sort: '-created' })
  return { ...result, items: result.items.map((item) => ({ id: item.id, title: item.title, reference: data.source === 'orders' ? item.order?.number || item.quote_number : item.quote_number, company: item.company_name, amount: item.subtotal, currency: item.currency, tone: quoteStatusTones[item.status], status: data.source === 'orders' ? ({ confirmed: 'Confirmée', in_progress: 'En cours', completed: 'Terminée' }[item.order?.status || 'confirmed'] || 'Commande') : quoteStatusLabels[item.status], href: `/sales/quotes/${item.id}` })) }
}
