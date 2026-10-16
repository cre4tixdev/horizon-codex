import { createPocketBaseClient } from '../../../core/pocketbase/client'
import { balanceSchema, choicesSchema, listSchema, requestSchema, allocationsSchema, allocationSchema, calendarSchema, previewSchema, type LeaveRequest, type LeaveInput, type AllocationInput, type PolicyInput } from '../schemas/leave'
export function createLeaveRepository(url: string) {
  const client = createPocketBaseClient(url), base = '/api/horizon/leave'
  const get = (path: string, query: Record<string, string> = {}) => client.send(base + path, { query, requestKey: null })
  const post = (path: string, body: object) => client.send(base + path, { method: 'POST', body, requestKey: null })
  return {
    async balances(year: string) { return balanceSchema.array().parse(await get('/balances', { year })) },
    async choices() { return choicesSchema.parse(await get('/choices')) },
    async list(query: Record<string, string>) { return listSchema.parse(await get('/requests', query)) },
    async record(id: string) { return requestSchema.parse(await get(`/requests/${id}`)) },
    async preview(input: Pick<LeaveInput, 'start_date' | 'end_date' | 'start_half' | 'end_half'>) { return previewSchema.parse(await post('/preview', input)) },
    async save(input: LeaveInput, key: string, files: File[], removed: string[], record?: LeaveRequest) {
      const body = new FormData(); body.set('input', JSON.stringify(input)); body.set('creation_key', key); body.set('removed', JSON.stringify(removed))
      if (record) { body.set('id', record.id); body.set('updated', record.updated) }
      files.forEach((file) => body.append('attachments', file))
      return requestSchema.parse(await post('/requests', body))
    },
    async transition(record: LeaveRequest, action: string, reason: string, manager: string) { return requestSchema.parse(await post(`/requests/${record.id}/transition`, { updated: record.updated, action, reason, manager })) },
    async allocations(query: Record<string, string>) { return allocationsSchema.parse(await get('/allocations', query)) },
    async allocate(input: AllocationInput) { return allocationSchema.parse(await post('/allocations', input)) },
    async settings(input: PolicyInput) { return choicesSchema.parse(await post('/settings', { updated: input.updated, weekdays: input.weekdays, holidays: input.holidays, holiday_calendar: input.holiday_calendar, working_holidays: input.working_holidays, types: input.types })) },
    async calendar(query: Record<string, string>) { return calendarSchema.parse(await get('/calendar', query)) },
    async fileURL(record: LeaveRequest, name: string) { return client.files.getURL(record, name, { token: await client.files.getToken({ requestKey: null }) }) },
  }
}
