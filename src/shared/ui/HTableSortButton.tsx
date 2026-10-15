import type { ListTableSorting } from '../search/useListTableSorting'
import { listSortDirection, toggleListSort } from '../search/tableSorting'
import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

export function HTableSortButton({ label, children, direction, onClick }: { label: string; children: ReactNode; direction: 'asc' | 'desc' | false; onClick: () => void }) {
  return <button type="button" className="h-table-sort-button" data-sort-active={Boolean(direction)} title={`Trier ${label} par ordre ${direction === 'asc' ? 'décroissant' : 'croissant'}`} onClick={onClick}>
    <span className="h-table-sort-label">{children}</span>{direction === 'asc' ? <ArrowUp size={12} aria-hidden="true" /> : direction === 'desc' ? <ArrowDown size={12} aria-hidden="true" /> : <ArrowUpDown size={12} aria-hidden="true" />}
  </button>
}

/** Native reference tables use the same header contract as HDataTable. */
export function HSortableTableHeader({ label, column, sorting, className }: { label: string; column: string; sorting: ListTableSorting; className?: string }) {
  const direction = listSortDirection(sorting, column)
  return <th scope="col" className={className} aria-sort={direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : undefined}><HTableSortButton label={label} direction={direction} onClick={() => toggleListSort(sorting, column)}>{label}</HTableSortButton></th>
}
