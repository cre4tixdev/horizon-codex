import { Search } from 'lucide-react'
import { useRef, useState } from 'react'
import { useFileSource } from '../hooks/useFileSource'
import { HFilePreview } from './HFilePreview'

/** A clickable thumbnail shares the same viewer for local and protected attachments. */
export function HFileThumbnail({ source: input, name, pdf, previewIcon = false }: { source: File | string; name: string; pdf: boolean; previewIcon?: boolean }) {
  const trigger = useRef<HTMLButtonElement>(null), [previewUrl, setPreviewUrl] = useState('')
  const { image, frame, source } = useFileSource(input, '#toolbar=0&navpanes=0&view=Fit')
  return <><button ref={trigger} type="button" className={`h-file-thumbnail${previewIcon ? ' h-file-thumbnail--preview' : ''}`} title={`Aperçu ${name}`} aria-label={`${previewIcon ? 'Aperçu' : 'Agrandir'} ${name}`} onClick={() => setPreviewUrl(source.current)}>{pdf ? <iframe ref={frame} title={`Miniature ${name}`} tabIndex={-1} aria-hidden="true" /> : <img ref={image} alt={`Miniature ${name}`} />}<span>{name}</span>{previewIcon && <span className="h-file-thumbnail-zoom" aria-hidden="true"><Search size={13} /></span>}</button>{previewUrl && <HFilePreview name={name} url={previewUrl} pdf={pdf} onClose={() => setPreviewUrl('')} onCloseAutoFocus={(event) => { event.preventDefault(); trigger.current?.focus() }} />}</>
}
