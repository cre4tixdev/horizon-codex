import { Link } from 'react-router'
import { Mail, Phone, Building2, UsersRound, MapPin } from 'lucide-react'
import { HBadge } from '../../../shared/ui/HBadge'
import { useReferences } from '../../settings/hooks/useReferences'
import { ContactAvatar } from './ContactIdentity'
import { roleLabels } from '../schemas/contacts'
import type { Company, Person } from '../types/contacts'
import type { ContactDirectoryContext } from '../navigationContext'

export function ContactCards({ records, directory }: { records: (Company | Person)[]; directory?: ContactDirectoryContext }) {
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
    const phone = record.phone || person?.mobile
    const roles = relatedCompany?.expand?.contacts_company_roles_via_company?.filter((role) => role.active) ?? []
    return <article className={`contact-directory-card${person ? ' contact-directory-card--person' : ''}`} key={record.id}>
      <Link className="contact-card-portrait" to={destination} state={directory ? { contactDirectory: directory } : undefined} aria-label={`Ouvrir la fiche de ${name}`}><ContactAvatar kind={company ? 'company' : 'person'} collectionId={record.collectionId} id={record.id} filename={company?.logo ?? person?.avatar ?? ''} company={person?.expand?.company} /></Link>
      <div className="contact-card-body">
        <Link className="contact-card-title" to={destination} state={directory ? { contactDirectory: directory } : undefined} title={name}><span>{name}</span></Link>
        {person && (person.job_title || person.expand?.company) && <div className="contact-card-meta">
          {person.job_title && <p className="contact-card-function" title={person.job_title}>{person.job_title}</p>}
          {person.expand?.company && <Link className="contact-card-company" to={`/contacts/companies/${person.company}`} title={person.expand.company.name}><Building2 size={12} /><span>{person.expand.company.name}</span></Link>}
        </div>}
        <div className="contact-card-coordinates">
          {person ? <>
            {record.email && <Link className="contact-card-primary-coordinate" to={destination} state={directory ? { contactDirectory: directory } : undefined} title={record.email}><Mail size={14} aria-hidden="true" /><span>{record.email}</span></Link>}
            {location && <p className={record.email ? undefined : 'contact-card-primary-coordinate'} title={location} aria-label={location}><MapPin size={14} aria-hidden="true" />{!record.email && <span>{location}</span>}</p>}
            {phone && <a className={!record.email && !location ? 'contact-card-primary-coordinate' : undefined} href={`tel:${phone}`} title={phone} aria-label={phone}><Phone size={14} aria-hidden="true" />{!record.email && !location && <span>{phone}</span>}</a>}
          </> : <>
          {record.email && <Link to={destination} state={directory ? { contactDirectory: directory } : undefined} title={record.email}><Mail size={16} aria-hidden="true" /><span>{record.email}</span></Link>}
          {(location || phone) && <div className="contact-card-secondary">
            {location && <p title={[location, address?.line1, address?.postal_code].filter(Boolean).join(' · ')}><MapPin size={14} aria-hidden="true" /><span>{location}</span></p>}
            {phone && <a href={`tel:${phone}`} title={phone}><Phone size={14} aria-hidden="true" /><span>{phone}</span></a>}
          </div>}
          </>}
          {!record.email && !phone && !location && <span className="contact-muted">Coordonnées à compléter</span>}
        </div>
      </div>
      <div className="contact-card-footer"><div className="contact-role-list">{roles.map((role) => <HBadge key={role.id} className={`contact-role-pill contact-role-pill--${role.role}`}>{roleLabels[role.role]}</HBadge>)}{!record.active && <HBadge>Archivé</HBadge>}</div><Link className={`contact-card-kind contact-card-kind--${company ? 'company' : 'person'}`} to={destination} state={directory ? { contactDirectory: directory } : undefined} title={company ? 'Société' : 'Personne'} aria-label={company ? 'Société' : 'Personne'}>{company ? <Building2 size={14} aria-hidden="true" /> : <UsersRound size={14} aria-hidden="true" />}</Link></div>
    </article>
  })}</div>
}
