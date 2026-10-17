import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, FileSpreadsheet, Image, File as FileIcon } from 'lucide-react'
import { useFileSource } from '../../../shared/hooks/useFileSource'
import { HDirectoryCard } from '../../../shared/ui/HDirectoryCard'
import { HTag } from '../../../shared/ui/HTag'
import { useLibraryAccess } from '../hooks/useLibrary'
import { libraryService } from '../services/LibraryService'
import { libraryThemes, type LibraryFile } from '../schemas/library'
export function LibraryFileCard({ record, selected, onSelect }: { record: LibraryFile; selected: boolean; onSelect: () => void }) {
  const access = useLibraryAccess(), ref = useRef<HTMLDivElement>(null), [visible, setVisible] = useState(false)
  useEffect(() => { const node = ref.current; if (!node) return; const observer = new IntersectionObserver(([entry]) => { if (entry?.isIntersecting) { setVisible(true); observer.disconnect() } }); observer.observe(node); return () => observer.disconnect() }, [])
  const isImage = /\.(png|jpe?g|webp)$/i.test(record.current.filename)
  const file = useQuery({ queryKey: ['ged', 'file', access.key, record.id, record.current.id], queryFn: async () => { const blob = await libraryService.file(record.id, record.current.id); return new File([blob], record.current.filename, { type: blob.type }) }, enabled: visible && isImage, retry: false, staleTime: 60_000 })
  const source = isImage ? file.data : undefined, { image } = useFileSource(source)
  const extension = record.current.filename.split('.').pop()?.toUpperCase() || 'FICHIER', Icon = isImage ? Image : extension === 'PDF' ? FileText : /XLS|CSV/.test(extension) ? FileSpreadsheet : FileIcon
  const affair = record.links.find((l) => l.entity === 'crm_opportunities'), relation = affair || record.links[0]
  return <div ref={ref} className="ged-card" data-selected={selected}><HDirectoryCard portrait={<span className="ged-card-visual">{source ? <img ref={image} alt="" loading="lazy" /> : <><Icon size={24} /><small>{extension}</small></>}</span>} title={<button className="contact-card-title ged-card-select" type="button" aria-label={`Afficher ${record.name}`} onClick={onSelect} title={record.name}><span>{record.name}</span></button>} footer={<><HTag>{record.type_label || libraryThemes[record.theme || ''] || record.category_name}</HTag><span className="ged-card-version">{record.origin ? 'Pièce liée' : `v${record.current.number}`}</span></>}>
    <p className="ged-card-context" title={record.source_label || relation?.label || record.folder_name}>{record.source_label || relation?.label || record.folder_name}</p>
    {isImage && file.error && <small role="status">Miniature indisponible</small>}
  </HDirectoryCard></div>
}
