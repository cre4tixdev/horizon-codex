import { Link } from 'react-router'
import { Mail, Phone, Building2, MapPin } from 'lucide-react'
import { HBadge } from '../../../shared/ui/HBadge'
import { useReferences } from '../../settings/hooks/useReferences'
import { ContactAvatar } from './ContactIdentity'
import { roleLabels } from '../schemas/contacts'
import type { Company, Person } from '../types/contacts'

export function ContactCards({ records }: { records: (Company | Person)[] }) {
  const countries = useReferences('settings_countries')
  return <div className="contact-card-grid" aria-label="Fiches en cartes">{records.map((record) => {
    const company = 'name' in record ? record : undefined
    const person = 'first_name' in record ? record : undefined
    const relatedCompany = company ?? person?.expand?.company
    const name = company?.name ?? [person?.first_name, person?.last_name].filter(Boolean).join(' ')
    const destination = `/contacts/${company ? 'companies' : 'people'}/${record.id}`
    const registered = relatedCompany?.expand?.contacts_addresses_via_company?.filter((address) => address.type === 'registered') ?? []
    const address = registered.find((item) => item.is_primary) ?? (registered.length === 1 ? registered[0] : undefined)
    const country = countries.data?.find((item) => item.code === address?.country)?.label ?? address?.country
    const location = [address?.city, country].filter(Boolean).join(', ')
    const roles = relatedCompany?.expand?.contacts_company_roles_via_company?.filter((role) => role.active) ?? []
    return <article className="contact-directory-card" key={record.id}>
      <Link className="contact-card-portrait" to={destination} aria-label={`Ouvrir la fiche de ${name}`}><ContactAvatar kind={company ? 'company' : 'person'} collectionId={record.collectionId} id={record.id} filename={company?.logo ?? person?.avatar ?? ''} company={person?.expand?.company} /></Link>
      <div className="contact-card-body">
        <Link className="contact-card-title" to={destination}>{name}</Link>
        {person?.job_title && <p className="contact-card-function">{person.job_title}</p>}
        {person?.expand?.company && <Link className="contact-card-company" to={`/contacts/companies/${person.company}`}><Building2 size={14} />{person.expand.company.name}</Link>}
        <div className="contact-card-coordinates">
          {record.email && <a href={`mailto:${record.email}`}><Mail size={16} aria-hidden="true" /><span>{record.email}</span></a>}
          {location && <p title={person ? `Siège de ${relatedCompany?.name}` : [address?.line1, address?.postal_code, address?.city].filter(Boolean).join(', ')}><MapPin size={16} aria-hidden="true" /><span>{location}</span></p>}
          {(record.phone || person?.mobile) && <a href={`tel:${record.phone || person?.mobile}`}><Phone size={16} aria-hidden="true" /><span>{record.phone || person?.mobile}</span></a>}
          {!record.email && !record.phone && !person?.mobile && !location && <span className="contact-muted">Coordonnées à compléter</span>}
        </div>
        <div className="contact-card-footer"><div className="contact-role-list">{roles.map((role) => <HBadge key={role.id} className={`contact-role-pill contact-role-pill--${role.role}`}>{roleLabels[role.role]}</HBadge>)}{!record.active && <HBadge>Archivé</HBadge>}</div></div>
      </div>
    </article>
  })}</div>
}
