import { useResizableTableColumns } from './useResizableTableColumns'
import { HLoadingIndicator } from './HLoadingIndicator'
import { HButton } from './HButton'
import { useTableColumnPolicies } from './useTableColumnPolicies'
import { excludedTableColumns } from '../../core/preferences/tableColumnPolicies'
import { type ReactNode, type CSSProperties } from 'react'
import { HSortableRows, HSortableRow, HRowDragHandle } from './HSortableRows'
import { HTableViewport } from './HTableViewport'
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef, type OnChangeFn, type SortingState, type Header } from '@tanstack/react-table'
import { Link } from 'react-router'
import type { ListTableSorting } from '../search/useListTableSorting'
import { HTableSortButton } from './HTableSortButton'
import { listSortDirection, toggleListSort } from '../search/tableSorting'
import { HTableColumns } from './HTableColumns'
import { useTableColumns } from './useTableColumns'
import { resolveTableColumns, defaultTableColumns } from './tableColumns'

type RowReordering<T> = { getRowId: (record: T) => string; getRowLabel: (record: T) => string; onMove: (from: number, to: number) => void }

export function HDataTable<T>({ bodyStart, columnSettings, reordering, data, columns, sorting = [], onSortingChange, getRowLink, getRowAction, columnBorders = false, resizable: resizeEnabled, columnAlignments = {}, columnClasses = {}, columnWidths = {}, listSorting }: { bodyStart?: ReactNode; columnSettings?: { id: string; required?: string[]; defaultHidden?: string[] }; listSorting?: ListTableSorting; reordering?: RowReordering<T>; columnWidths?: Record<string, CSSProperties['width']>; columnClasses?: Record<string, string>; columnAlignments?: Record<string, 'left' | 'center' | 'right'>; data: T[]; columns: ColumnDef<T>[]; resizable?: boolean; columnBorders?: boolean; sorting?: SortingState; onSortingChange?: OnChangeFn<SortingState>; getRowLink?: (record: T) => { href: string; label: string; state?: unknown } | undefined; getRowAction?: (record: T) => { label: string; onClick: () => void } }) {
  const ids = columns.flatMap((column) => {
    const id = column.id || ('accessorKey' in column ? String(column.accessorKey).replaceAll('.', '_') : typeof column.header === 'string' ? column.header : '')
    return id ? [id] : []
  })
  const configurable = Boolean(columnSettings && !reordering && ids.length === columns.length && new Set(ids).size === ids.length && ids.length > 0)
  const resizable = resizeEnabled ?? configurable
  const preferences = useTableColumns(configurable ? columnSettings?.id : undefined)
  const required = [ids[0] || '', ...(columnSettings?.required || []), ...columns.flatMap((column, index) => column.enableHiding === false ? [ids[index]!] : [])]
  const policies = useTableColumnPolicies(configurable)
  const excluded = excludedTableColumns(columnSettings?.id || '', policies.data?.items || []).filter((id) => !required.includes(id))
  const resolved = resolveTableColumns(ids, required, preferences.preference, columnSettings?.defaultHidden)
  // React Compiler is not enabled; keep the required TanStack Table v8 hook uncompiled.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({ data, columns, ...(reordering ? { getRowId: reordering.getRowId } : {}), getCoreRowModel: getCoreRowModel(), manualSorting: true, state: { sorting, ...(configurable ? { columnOrder: resolved.order, columnVisibility: Object.fromEntries([...resolved.hidden, ...excluded].map((id) => [id, false])) } : {}) }, ...(onSortingChange ? { onSortingChange } : {}), enableSorting: Boolean(onSortingChange), enableMultiSort: false, enableColumnResizing: resizable, columnResizeMode: 'onChange' })
  const resizeReady = preferences.canEdit && !policies.isError && !policies.isPending
  const sizing = useResizableTableColumns({ enabled: configurable && resizable && Boolean(policies.data), identity: ids[0] || '', ids: table.getVisibleLeafColumns().map((column) => column.id), saved: preferences.preference.widths, version: data, onCommit: (widths) => preferences.change({ ...resolved, widths: { ...preferences.preference.widths, ...Object.fromEntries(Object.entries(widths).map(([id, width]) => [id, Math.round(width * 100) / 100])) } }) })
  const renderHeader = (header: Header<T, unknown>) => {
      const field = listSorting?.fields[header.column.id]
      if (!field && !header.column.getCanSort()) return flexRender(header.column.columnDef.header, header.getContext())
      const direction = field ? listSortDirection(listSorting!, header.column.id) : header.column.getIsSorted()
      const label = typeof header.column.columnDef.header === 'string' ? header.column.columnDef.header : header.id
      return <HTableSortButton label={label} direction={direction} onClick={() => field ? toggleListSort(listSorting!, header.column.id) : header.column.toggleSorting(direction === 'asc')}>{flexRender(header.column.columnDef.header, header.getContext())}</HTableSortButton>
  }
  const tableStyle: CSSProperties & { '--h-table-min-width': string } = { '--h-table-min-width': `${table.getTotalSize()}px`, ...(sizing.manual ? { minWidth: sizing.total + 2 } : {}) }
  const renderTable = (columnsTrigger?: ReactNode) => <HTableViewport ref={sizing.ref} className="data-table-scroll"><table className="h-data-table" style={resizable ? tableStyle : undefined} data-resizable={resizable || undefined} data-column-borders={columnBorders || undefined} data-configurable={configurable || undefined} data-manual-sizing={sizing.manual || undefined}>{((resizable && !configurable) || sizing.manual || Object.keys(columnWidths).length > 0) && <colgroup>{table.getVisibleLeafColumns().map((column) => <col key={column.id} style={{ width: sizing.manual ? `${sizing.widths[column.id]! / sizing.total * 100}%` : resizable && !configurable ? `${column.getSize() / table.getTotalSize() * 100}%` : columnWidths[column.id] }} />)}</colgroup>}<thead>{table.getHeaderGroups().map((group) => <tr key={group.id}>{group.headers.map((header) => <th key={header.id} data-column-id={header.column.id} className={columnClasses[header.column.id]} data-align={columnAlignments[header.column.id]} scope="col" aria-label={configurable ? typeof header.column.columnDef.header === 'string' ? header.column.columnDef.header : header.id : undefined} aria-sort={(() => { const direction = listSorting ? listSortDirection(listSorting, header.column.id) : header.column.getIsSorted(); return direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : undefined })()}>
    {columnsTrigger && header.index === group.headers.length - 1 ? <div className="h-table-header-with-columns"><span>{renderHeader(header)}</span>{columnsTrigger}</div> : renderHeader(header)}

    {configurable ? resizable && header.index < group.headers.length - 1 && header.column.getCanResize() && <button type="button" className="h-table-column-resizer" aria-disabled={!resizeReady} aria-label={`Redimensionner ${typeof header.column.columnDef.header === 'string' ? header.column.columnDef.header : header.id}`} title="Glisser pour répartir la largeur · Double-clic pour rétablir les largeurs" onPointerDown={(event) => { if (resizeReady) sizing.start(event, header.column.id) }} onPointerMove={sizing.move} onPointerUp={sizing.end} onPointerCancel={sizing.cancel} onLostPointerCapture={sizing.cancel} onDoubleClick={() => { if (resizeReady) preferences.change({ ...resolved, widths: {} }) }} onKeyDown={(event) => { if (resizeReady) sizing.keyboard(event, header.column.id) }} /> : resizable && header.column.getCanResize() && <button type="button" className="h-table-column-resizer" aria-label={`Redimensionner ${typeof header.column.columnDef.header === 'string' ? header.column.columnDef.header : header.id}`} title="Glisser pour ajuster la largeur" onMouseDown={header.getResizeHandler()} onTouchStart={header.getResizeHandler()} onDoubleClick={() => header.column.resetSize()} onKeyDown={(event) => { if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return; event.preventDefault(); table.setColumnSizing((sizes) => ({ ...sizes, [header.column.id]: Math.max(header.column.columnDef.minSize || 20, Math.min(header.column.columnDef.maxSize || 600, header.column.getSize() + (event.key === 'ArrowRight' ? 10 : -10))) })) }} />}
  </th>)}</tr>)}</thead><tbody>{bodyStart}{table.getRowModel().rows.map((row) => {
    const link = getRowLink?.(row.original)
    const action = getRowAction?.(row.original)
    const cells = (handleRef?: (element: Element | null) => void) => row.getVisibleCells().map((cell, index) => {
      const content = flexRender(cell.column.columnDef.cell, cell.getContext())
      return <td key={cell.id} data-identity={configurable && cell.column.id === ids[0] || undefined} className={columnClasses[cell.column.id]} data-align={columnAlignments[cell.column.id]}>{index === 0 && (link ? <Link className="h-data-table-row-link" to={link.href} state={link.state} aria-label={link.label} /> : action ? <button type="button" className="h-data-table-row-link" aria-label={action.label} onClick={action.onClick} /> : null)}{index === 0 && handleRef ? <div className="h-table-row-position"><HRowDragHandle handleRef={handleRef} index={row.index} />{content}</div> : content}</td>
    })
    const className = link || action ? 'h-data-table-clickable-row' : undefined
    return reordering ? <HSortableRow key={row.id} id={row.id} index={row.index} className={className}>{cells}</HSortableRow> : <tr key={row.id} className={className}>{cells()}</tr>
  })}</tbody></table></HTableViewport>
  const choices = resolved.order.filter((id) => !excluded.includes(id))
  const policyBusy = configurable && policies.isPending
  const canEdit = preferences.canEdit && !policyBusy && !policies.isError
  const content = configurable ? <HTableColumns error={policies.error?.message || preferences.error} busy={preferences.busy || policyBusy} canEdit={canEdit} onRetry={() => { preferences.retry(); void policies.refetch() }} columns={choices.map((id) => {
    const column = table.getColumn(id)!
    return { id, label: typeof column.columnDef.header === 'string' ? column.columnDef.header : id, visible: !resolved.hidden.includes(id), required: required.includes(id) }
  })} onToggle={(id) => preferences.change(resolveTableColumns(ids, required, { ...resolved, hidden: resolved.hidden.includes(id) ? resolved.hidden.filter((value) => value !== id) : [...resolved.hidden, id] }))} onMove={(from, to) => {
    const order = [...resolved.order], source = order.indexOf(choices[from]!), target = order.indexOf(choices[to]!)
    const [moved] = order.splice(source, 1)
    if (moved) order.splice(target, 0, moved)
    preferences.change(resolveTableColumns(ids, required, { ...resolved, order }))
  }} onReset={() => preferences.change(defaultTableColumns)}>{renderTable}</HTableColumns> : renderTable()
  if (configurable && !policies.data) return policies.error ? <p role="alert" className="field-error">{policies.error.message}<HButton size="small" onClick={() => void policies.refetch()}>Réessayer</HButton></p> : <HLoadingIndicator label="Chargement des colonnes du tableau" />
  return <>{configurable && preferences.error && <p role="alert" className="field-error">{preferences.error}<HButton size="small" onClick={preferences.retry} disabled={preferences.busy}>Recharger les colonnes</HButton></p>}{reordering ? <HSortableRows ids={data.map(reordering.getRowId)} onMove={reordering.onMove} renderPreview={(index): ReactNode => <div className="h-table-drag-summary"><span>{index + 1}</span><strong>{reordering.getRowLabel(data[index]!) || 'Nouvelle ligne'}</strong></div>}>{content}</HSortableRows> : content}</>
}
