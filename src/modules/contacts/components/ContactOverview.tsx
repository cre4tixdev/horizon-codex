import { Mail, Phone, Smartphone, Building2, Globe } from 'lucide-react'
import { Link } from 'react-router'
import type { Company, Person } from '../types/contacts'

export function ContactOverview({ record }: { record: Company | Person }) {
  const person = 'first_name' in record ? record : undefined
  const company = 'name' in record ? record : undefined
  return <div className="contact-coordinate-strip" aria-label="Coordonnées principales">
    <div><Mail size={17} /><span><small>E-mail</small>{record.email ? <a href={`mailto:${record.email}`}>{record.email}</a> : <em>Non renseigné</em>}</span></div>
    <div><Phone size={17} /><span><small>Téléphone</small>{record.phone ? <a href={`tel:${record.phone}`}>{record.phone}</a> : <em>Non renseigné</em>}</span></div>
    {person && <><div><Smartphone size={17} /><span><small>Mobile</small>{person.mobile ? <a href={`tel:${person.mobile}`}>{person.mobile}</a> : <em>Non renseigné</em>}</span></div><div><Building2 size={17} /><span><small>Société</small>{person.expand?.company ? <Link to={`/contacts/companies/${person.company}`}>{person.expand.company.name}</Link> : <em>Sans société</em>}</span></div></>}
    {company && <div><Globe size={17} /><span><small>Site web</small>{company.website ? <a href={company.website} target="_blank" rel="noreferrer">{company.website.replace(/^https?:\/\//, '')}</a> : <em>Non renseigné</em>}</span></div>}
  </div>
}
