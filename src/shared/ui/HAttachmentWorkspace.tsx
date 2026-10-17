import type { ReactNode } from 'react'
import { FileText, Trash2 } from 'lucide-react'
import { HButton } from './HButton'
import { HAttachmentPreview, type AttachmentPreview } from './HAttachmentPreview'
export type { AttachmentPreview } from './HAttachmentPreview'

/** Selecting a file only changes the document preview on the right. */
export function HAttachmentWorkspace({ uploadLabel = 'Charger des documents', documentsLabel = 'Documents', details, upload, files, selectedId, onSelect, onRemove, disabled, loading, error, children }: { uploadLabel?: string; documentsLabel?: string; details?: ReactNode; upload?: ReactNode; files: AttachmentPreview[]; selectedId: string; onSelect: (id: string) => void; onRemove?: ((id: string) => void) | undefined; disabled?: boolean; loading?: boolean; error?: string | undefined; children?: ReactNode }) {
  const file = files.find((item) => item.id === selectedId)
  return <div className={`h-attachment-workspace${details ? ' h-attachment-workspace--details' : ''}`} ><aside className="h-attachment-sidebar">{details}{upload && <section><h3>{uploadLabel}</h3>{upload}</section>}<section><h3>{documentsLabel} ({files.length})</h3>{files.map((item) => <div className="h-attachment-file" data-selected={item.id === selectedId} key={item.id}><button type="button" className="h-attachment-file-select" aria-label={`Afficher ${item.name}`} aria-pressed={item.id === selectedId} title={item.name} disabled={disabled} onClick={() => onSelect(item.id)}><FileText size={20} /><span><strong>{item.name}</strong>{item.status && <small>{item.status}</small>}</span></button>{onRemove && item.removable !== false && <HButton variant="ghost" size="icon" aria-label={`Supprimer ${item.name}`} disabled={disabled} onClick={() => onRemove(item.id)}><Trash2 size={14} /></HButton>}</div>)}{children}</section></aside>
    <HAttachmentPreview file={file} loading={loading} error={error} />
  </div>
}
