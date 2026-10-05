import { useQuery } from '@tanstack/react-query'
import { Building2, UserRound } from 'lucide-react'
import { contactsService } from '../services/ContactsService'
import type { Company } from '../types/contacts'

function ProtectedImage({ collectionId, id, filename, className }: { collectionId: string; id: string; filename: string; className?: string | undefined }) {
  const image = useQuery({ queryKey: ['contacts', 'image', collectionId, id, filename], queryFn: () => contactsService.imageURL(collectionId, id, filename), staleTime: 60_000, refetchInterval: 60_000, retry: false })
  return image.data ? <img src={image.data} alt="" className={className} referrerPolicy="no-referrer" /> : <span title={image.error ? 'Image indisponible' : 'Chargement de l’image'} className={className} aria-label={image.error ? 'Image indisponible' : undefined} />
}
type IdentityProps = { kind: 'company' | 'person'; collectionId: string; id: string; filename: string; company?: Company | undefined }
export function ContactAvatar({ kind, collectionId, id, filename, company }: IdentityProps) {
  return <span className={`contact-avatar contact-avatar--${kind}`}>
    {filename ? <ProtectedImage collectionId={collectionId} id={id} filename={filename} className={kind === 'company' ? 'contact-logo-image' : 'contact-person-image'} /> : kind === 'company' ? <Building2 size={16} /> : <UserRound size={16} />}
    {company?.logo && <ProtectedImage collectionId={company.collectionId} id={company.id} filename={company.logo} className="contact-company-badge contact-logo-image" />}
  </span>
}
export function ContactIdentity({ name, ...photo }: IdentityProps & { name: string }) {
  return <span className="contact-identity"><ContactAvatar {...photo} /><span>{name}</span></span>
}
export function GalleryImage({ company, filename }: { company: Pick<Company, 'collectionId' | 'id'>; filename: string }) {
  return <ProtectedImage collectionId={company.collectionId} id={company.id} filename={filename} className="contact-gallery-image" />
}
