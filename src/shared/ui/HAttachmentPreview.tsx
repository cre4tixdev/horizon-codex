import type { ReactNode } from 'react'
import { Paperclip } from 'lucide-react'
import { useFileSource } from '../hooks/useFileSource'
import { HLoadingIndicator } from './HLoadingIndicator'
export type AttachmentPreview = { removable?: boolean; id: string; name: string; source?: File | string | undefined; pdf: boolean; previewable?: boolean; status?: string | undefined }
export function HAttachmentPreview({ file, loading, error, actions }: { file?: AttachmentPreview | undefined; loading?: boolean | undefined; error?: string | undefined; actions?: ReactNode }) {
  const { image, frame } = useFileSource(file?.previewable === false ? undefined : file?.source, '#navpanes=0&view=Fit')
  return <section className="h-attachment-preview" aria-label="Aperçu du document sélectionné"><div className="h-attachment-preview-toolbar"><span title={file?.name}>{file?.name || 'Aperçu du document'}</span>{actions}</div><div className="h-attachment-preview-content">{file?.source && file.previewable !== false ? file.pdf ? <iframe ref={frame} title={`Aperçu ${file.name}`} /> : <img ref={image} alt={`Aperçu ${file.name}`} /> : <div className="h-attachment-placeholder">{loading ? <HLoadingIndicator label="Chargement du document" /> : <><Paperclip size={28} /><p role={error ? 'alert' : undefined}>{error || (file?.previewable === false ? 'Ce format est disponible en téléchargement.' : 'Aucun document sélectionné')}</p>{!error && !file && <small>Ajoutez un fichier pour afficher son aperçu.</small>}</>}</div>}</div></section>
}
