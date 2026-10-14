import { createPocketBaseClient } from '../../../core/pocketbase/client'
import { choicesSchema, listSchema, reportSchema, categorySchema, type ExpenseReport, type ExpenseInput, type ReportInput, type ExpenseLine, type ExpenseCategory } from '../schemas/expenses'
export function createExpensesRepository(url: string) {
  const client = createPocketBaseClient(url), base = '/api/horizon/expenses'
  const send = (path: string, body: object) => client.send(base + path, { method: 'POST', body, requestKey: null })
  return {
    async choices() { return choicesSchema.parse(await client.send(base + '/choices', { requestKey: null })) },
    async list(query: Record<string, string | number>) { return listSchema.parse(await client.send(base + '/reports', { query, requestKey: null })) },
    async record(id: string) { return reportSchema.parse(await client.send(base + '/reports/' + id, { requestKey: null })) },
    async save(input: ReportInput, record?: ExpenseReport) { return reportSchema.parse(await send('/reports', { ...input, ...(record ? { id: record.id, updated: record.updated } : {}) })) },
    async line(record: ExpenseReport, input: ExpenseInput, files: File[], removed: string[], line?: ExpenseLine) { const body = new FormData(); body.set('input', JSON.stringify(input)); body.set('updated', record.updated); body.set('removed', JSON.stringify(removed)); if (line) body.set('id', line.id); files.forEach((file) => body.append('receipt', file)); return reportSchema.parse(await send(`/reports/${record.id}/lines`, body)) },
    async order(record: ExpenseReport, ids: string[]) { return reportSchema.parse(await send(`/reports/${record.id}/order`, { updated: record.updated, ids })) },
    async remove(record: ExpenseReport, line_id: string) { return reportSchema.parse(await send(`/reports/${record.id}/remove`, { updated: record.updated, line_id })) },
    async transition(record: ExpenseReport, action: string, extra: { reason?: string; date?: string; reference?: string; validator?: string }) { return reportSchema.parse(await send(`/reports/${record.id}/transition`, { updated: record.updated, action, ...extra })) },
    async fileURL(line: ExpenseLine, name: string) { const token = await client.files.getToken({ requestKey: null }); return client.files.getURL(line, name, { token }) },
    async categories() { return categorySchema.array().parse(await client.send(base + '/categories', { requestKey: null })) },
    async category(input: Omit<ExpenseCategory, 'id' | 'updated'>, record?: ExpenseCategory) { return categorySchema.parse(await send('/categories', { ...input, ...(record ? { id: record.id, updated: record.updated } : {}) })) },
  }
}
