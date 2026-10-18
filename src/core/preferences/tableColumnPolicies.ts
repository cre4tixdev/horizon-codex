import { z } from 'zod'
import catalog from '../../../pocketbase/pb_hooks/config/table-columns.json'
export const tableColumnCatalog = catalog
export const tableColumnPolicySchema = z.object({ key: z.string(), revision: z.number().int().nonnegative(), excluded: z.array(z.string()).max(100) })
export const tableColumnPoliciesSchema = z.object({ items: z.array(tableColumnPolicySchema) })
export type TableColumnPolicy = z.infer<typeof tableColumnPolicySchema>
export function tableColumnPolicyKey(context: string) { return context.startsWith('inventory.operations.') ? 'inventory.operations' : context }
export function excludedTableColumns(context: string, policies: TableColumnPolicy[]) {
  const key = tableColumnPolicyKey(context), table = tableColumnCatalog.find((item) => item.key === key)
  return (policies.find((item) => item.key === key)?.excluded || []).filter((id) => table?.columns.some((column) => column.id === id && !column.required))
}
