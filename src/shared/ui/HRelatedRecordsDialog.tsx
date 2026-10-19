import { useState } from 'react'
import { HDialog } from './HDialog'
import { HDataTable } from './HDataTable'
import { HDialogFooter } from './HDialogFooter'
import { HListPagination } from './HListPagination'
export type RelatedRecordLink = { label: string; href: string; reference: string }
export function HRelatedRecordsDialog({ title, records, onClose }: { title: string; records: RelatedRecordLink[]; onClose: () => void }) {
  const [page, setPage] = useState(1), perPage = 25
  return <HDialog open className="related-records-dialog" title={title} description="Sélectionnez une pièce pour ouvrir sa fiche." onOpenChange={(open) => { if (!open) onClose() }}><div className="dialog-form"><HDataTable columnBorders data={records.slice((page - 1) * perPage, page * perPage)} columns={[{ header: 'Pièce', accessorKey: 'label' }, { header: 'État', accessorKey: 'reference' }]} getRowLink={(row) => ({ href: row.href, label: `Ouvrir ${row.label}` })} /></div><HDialogFooter><HListPagination page={page} totalPages={Math.ceil(records.length / perPage)} label="Pièces associées" placement="inline" onPageChange={setPage} /></HDialogFooter></HDialog>
}
