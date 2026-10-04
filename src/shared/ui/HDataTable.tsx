import { flexRender, getCoreRowModel, useReactTable, type ColumnDef, type OnChangeFn, type SortingState } from '@tanstack/react-table'
import { ArrowDown, ArrowUp } from 'lucide-react'

export function HDataTable<T>({ data, columns, sorting, onSortingChange }: { data: T[]; columns: ColumnDef<T>[]; sorting: SortingState; onSortingChange: OnChangeFn<SortingState> }) {
  // React Compiler is not enabled; keep the required TanStack Table v8 hook uncompiled.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel(), manualSorting: true, state: { sorting }, onSortingChange, enableMultiSort: false })
  return <div className="data-table-scroll"><table className="h-data-table"><thead>{table.getHeaderGroups().map((group) => <tr key={group.id}>{group.headers.map((header) => <th key={header.id} scope="col" aria-sort={header.column.getIsSorted() === 'asc' ? 'ascending' : header.column.getIsSorted() === 'desc' ? 'descending' : undefined}>
    {header.column.getCanSort() ? <button type="button" onClick={header.column.getToggleSortingHandler()}>{flexRender(header.column.columnDef.header, header.getContext())}{header.column.getIsSorted() === 'asc' && <ArrowUp size={12} />}{header.column.getIsSorted() === 'desc' && <ArrowDown size={12} />}</button> : flexRender(header.column.columnDef.header, header.getContext())}
  </th>)}</tr>)}</thead><tbody>{table.getRowModel().rows.map((row) => <tr key={row.id}>{row.getVisibleCells().map((cell) => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}</tbody></table></div>
}
