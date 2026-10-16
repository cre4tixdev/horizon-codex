import { tableTrackingColumns } from './tableTrackingColumns'

export function HTableTrackingCaption({ kind }: { kind: typeof tableTrackingColumns[number]['key'] }) {
  const { label, icon: Icon } = tableTrackingColumns.find((column) => column.key === kind)!
  return <span className="h-table-tracking-caption" title={label} aria-label={label}><Icon size={14} aria-hidden="true" /></span>
}
