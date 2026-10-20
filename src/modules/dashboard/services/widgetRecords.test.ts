import { describe, expect, it } from 'vitest'
import { dataSpecSchema } from '../schemas/widgetData'
import { dashboardPeriodRange } from './dashboardPeriod'
import { widgetRecordQuery, widgetRecordHref, widgetRange } from './widgetRecords'
const range = dashboardPeriodRange('quarter', '2026-10-20')
describe('widget data bindings', () => {
  it('passes each independent scope, company, status and period to the owner', () => {
    const data = dataSpecSchema.parse({ source: 'quotes', scope: 'own', company: '123456789abcdef', status: 'sent', period: 'dashboard', limit: 5 })
    expect(widgetRecordQuery(data, 'user', range, 2)).toEqual({ q: '', company: '123456789abcdef', owner: 'user', from: '2026-10-01', to: '2026-12-31', page: 2, perPage: 5 })
    const query = new URL(widgetRecordHref(data, 'user', range), 'http://local').searchParams
    expect(query.get('kind')).toBe('quote'); expect(query.get('status')).toBe('sent'); expect(query.get('owner')).toBe('user'); expect(query.has('page')).toBe(false)
    expect(widgetRecordQuery(dataSpecSchema.parse({}), 'user', range)).not.toHaveProperty('from')
    expect(widgetRange('all', range)).toBeNull()
  })
  it('builds the right destination for order and invoice sources', () => {
    expect(widgetRecordHref(dataSpecSchema.parse({ source: 'orders', status: 'completed' }), 'user', range)).toContain('order_status=completed')
    expect(widgetRecordHref(dataSpecSchema.parse({ source: 'invoices', status: 'overdue' }), 'user', range)).toContain('/billing/customer?status=overdue')
  })
})
