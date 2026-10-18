import type { TablePreference } from '../../core/preferences/tablePreferences'
export type TableColumnsPreference = TablePreference
export const defaultTableColumns: TableColumnsPreference = { order: [], hidden: [] }

/** Required columns stay visible, but every column can be reordered. */
export function resolveTableColumns(ids: string[], requiredIds: string[], preference: TableColumnsPreference, defaultHidden: string[] = []): TableColumnsPreference {
  const required = new Set([ids[0], ...requiredIds])
  return {
    ...(preference.widths ? { widths: Object.fromEntries(Object.entries(preference.widths).filter(([id]) => ids.includes(id))) } : {}),
    order: [...new Set([...preference.order, ...ids])].filter((id) => ids.includes(id)),
    hidden: [...new Set([...preference.hidden, ...defaultHidden.filter((id) => !preference.order.includes(id))])].filter((id) => ids.includes(id) && !required.has(id)),
  }
}
