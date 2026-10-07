import { flexRender, getCoreRowModel, useReactTable, type ColumnDef, type OnChangeFn, type SortingState } from '@tanstack/react-table'
import { Link } from 'react-router'
import { ArrowDown, ArrowUp } from 'lucide-react'

export function HDataTable<T>({ data, columns, sorting = [], onSortingChange, getRowLink, getRowAction }: { data: T[]; columns: ColumnDef<T>[]; sorting?: SortingState; onSortingChange?: OnChangeFn<SortingState>; getRowLink?: (record: T) => { href: string; label: string; state?: unknown }; getRowAction?: (record: T) => { label: string; onClick: () => void } }) {
  // React Compiler is not enabled; keep the required TanStack Table v8 hook uncompiled.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel(), manualSorting: true, state: { sorting }, ...(onSortingChange ? { onSortingChange } : {}), enableSorting: Boolean(onSortingChange), enableMultiSort: false })
  return <div className="data-table-scroll"><table className="h-data-table"><thead>{table.getHeaderGroups().map((group) => <tr key={group.id}>{group.headers.map((header) => <th key={header.id} scope="col" aria-sort={header.column.getIsSorted() === 'asc' ? 'ascending' : header.column.getIsSorted() === 'desc' ? 'descending' : undefined}>
    {header.column.getCanSort() ? <button type="button" onClick={header.column.getToggleSortingHandler()}>{flexRender(header.column.columnDef.header, header.getContext())}{header.column.getIsSorted() === 'asc' && <ArrowUp size={12} />}{header.column.getIsSorted() === 'desc' && <ArrowDown size={12} />}</button> : flexRender(header.column.columnDef.header, header.getContext())}
  </th>)}</tr>)}</thead><tbody>{table.getRowModel().rows.map((row) => {
    const link = getRowLink?.(row.original)
    const action = getRowAction?.(row.original)
    return <tr key={row.id} className={link || action ? 'h-data-table-clickable-row' : undefined}>{row.getVisibleCells().map((cell, index) => <td key={cell.id}>{index === 0 && (link ? <Link className="h-data-table-row-link" to={link.href} state={link.state} aria-label={link.label} /> : action ? <button type="button" className="h-data-table-row-link" aria-label={action.label} onClick={action.onClick} /> : null)}{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>
  })}</tbody></table></div>
}
