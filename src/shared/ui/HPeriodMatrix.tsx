import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router'
import { HDataTable } from './HDataTable'
import type { ListTableSorting } from '../search/useListTableSorting'
import './period-matrix.css'

type Period = { key: string; label: string }
/** Shared employee-by-period consultation grid. Business content remains with its owner. */
export function HPeriodMatrix<T>({ rows, periods, identity, cell, total, totalLabel = 'Total', sorting }: { rows: T[]; periods: Period[]; identity: (row: T) => ReactNode; cell: (row: T, index: number) => ReactNode; total: (row: T) => ReactNode; totalLabel?: string; sorting: ListTableSorting }) {
  return <div className="h-period-matrix" style={{ '--period-matrix-min-width': `${Math.max(520, 190 + periods.length * 100 + 140)}px` } as CSSProperties}><HDataTable data={rows} columnBorders listSorting={sorting} columnWidths={{ Employé: 190, Total: 140 }} columnAlignments={{ ...Object.fromEntries(periods.map((period) => [period.key, 'center' as const])), Total: 'right' }} columnClasses={{ Total: 'h-period-total' }} columns={[
    { id: 'Employé', header: 'Employé', cell: ({ row }) => identity(row.original) },
    ...periods.map((period, index) => ({ id: period.key, header: period.label, cell: ({ row }: { row: { original: T } }) => cell(row.original, index) })),
    { id: 'Total', header: totalLabel, cell: ({ row }) => total(row.original) },
  ]} /></div>
}
export function HPeriodCell({ children, status, label, href, state, onClick }: { children: ReactNode; status: string; label: string; href?: string | undefined; state?: unknown; onClick?: (() => void) | undefined }) {
  const props = { className: 'h-period-cell', 'data-state': status, 'aria-label': label }
  return href ? <Link {...props} to={href} state={state}>{children}</Link> : onClick ? <button {...props} type="button" onClick={onClick}>{children}</button> : <span {...props}>{children}</span>
}
