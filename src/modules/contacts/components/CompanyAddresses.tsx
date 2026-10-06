import { useState } from 'react'
import { MapPin, Mail, Plus, Pencil, X, Building2, Truck, ReceiptText } from 'lucide-react'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HButton } from '../../../shared/ui/HButton'
import { HInput } from '../../../shared/ui/HInput'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { ReferencePicker } from './ReferencePicker'
import { useReferences } from '../../settings/hooks/useReferences'
import { addressLabels, addressValues } from '../schemas/contacts'
import type { AddressInput } from '../types/contacts'

export type AddressDraft = { key: string; id?: string; virtual?: 'billing_email'; input: AddressInput }
const icons = { registered: Building2, billing: ReceiptText, shipping: Truck, other: MapPin }
export function CompanyAddresses({ drafts, editable, onChange, onAdd, onRemove, error }: { drafts: AddressDraft[]; editable: boolean; onChange: (key: string, input: AddressInput) => void; onAdd: () => string; onRemove: (key: string) => void; error: string }) {
  const countries = useReferences('settings_countries')
  const [editing, setEditing] = useState<string>()
  const current = drafts.find((draft) => draft.key === editing)
  return <section className="contact-related company-address-directory">
    <HSectionHeading title="Adresses de la société" count={drafts.length} description="Siège, livraison, facturation : adresses postales et e-mails par usage." actions={editable && <HButton size="small" onClick={() => setEditing(onAdd())}><Plus size={14} />Ajouter une adresse</HButton>} />
    {error && <p role="alert" className="field-error">{error}</p>}
    <div className="company-address-grid">{drafts.map((draft) => { const item = draft.input; const Icon = draft.virtual ? Mail : icons[item.type]; return <article className={`company-address-card${editing === draft.key ? ' company-address-card--editing' : ''}`} key={draft.key}>
      <div className="company-address-heading"><span className="company-address-icon"><Icon size={18} /></span><div><strong title={item.label || addressLabels[item.type]}>{item.label || addressLabels[item.type]}</strong><span>{addressLabels[item.type]}{item.is_primary ? ' · Principale' : ''}{!draft.id && !draft.virtual ? ' · À enregistrer' : ''}</span></div>{editable && <HButton variant="ghost" size="icon" aria-label={`Modifier l’adresse ${item.label || item.line1 || item.email || addressLabels[item.type]}`} onClick={() => setEditing(draft.key)}><Pencil size={14} /></HButton>}</div>
      {item.line1 && <div className="company-address-line"><MapPin size={15} /><p title={[item.line1, item.line2, item.postal_code, item.city, countries.data?.find((country) => country.code === item.country)?.label || item.country, item.state_region].filter(Boolean).join(', ')}>{[item.line1, item.line2].filter(Boolean).join(', ')}<br />{[item.postal_code, item.city, countries.data?.find((country) => country.code === item.country)?.label || item.country, item.state_region].filter(Boolean).join(' · ')}</p></div>}
      {item.email && <div className="company-address-line"><Mail size={15} /><a href={`mailto:${item.email}`} title={item.email}>{item.email}</a></div>}
      {!item.line1 && !item.email && <p className="contact-muted">À compléter</p>}
      {!draft.id && !draft.virtual && draft.key !== 'primary' && editable && <HButton className="company-address-remove" variant="ghost" size="icon" aria-label="Retirer du brouillon" title="Retirer du brouillon" onClick={() => { onRemove(draft.key); if (editing === draft.key) setEditing(undefined) }}><X size={12} /></HButton>}
    </article> })}</div>
    {!drafts.length && <div className="company-address-empty"><MapPin size={24} /><strong>Aucune adresse enregistrée</strong><p>Ajoutez une adresse postale, un e-mail ou les deux.</p></div>}
    {current && editable && <section className="contact-panel company-address-editor" aria-label="Modifier les coordonnées d’une adresse">
      <HSectionHeading title={current.id || current.virtual ? 'Modifier l’adresse' : 'Nouvelle adresse'} icon={MapPin} description="Les modifications seront sauvegardées avec Enregistrer en haut de la fiche." actions={<HButton variant="ghost" size="icon" aria-label="Fermer l’édition de l’adresse" onClick={() => setEditing(undefined)}><X size={16} /></HButton>} />
      <div className="contact-fields">
        <label htmlFor={`${current.key}-label`}>Libellé<HInput id={`${current.key}-label`} placeholder="Entrepôt Lyon, service comptabilité…" disabled={Boolean(current.virtual)} value={current.input.label || ''} onChange={(event) => onChange(current.key, { ...current.input, label: event.target.value })} /></label>
        <label>Usage<HCombobox label="Usage de l’adresse" required showCodes={false} disabled={current.key === 'primary' || Boolean(current.virtual)} value={current.input.type} options={addressValues.map((value) => ({ value, label: addressLabels[value] }))} onChange={(value) => { const type = addressValues.find((item) => item === value); if (type) onChange(current.key, { ...current.input, type }) }} /></label>
        <label htmlFor={`${current.key}-email`}>E-mail de cette adresse<HInput id={`${current.key}-email`} type="email" placeholder="facturation@societe.fr" value={current.input.email || ''} onChange={(event) => onChange(current.key, { ...current.input, email: event.target.value })} /></label>
      </div>
      {!current.virtual && <div className="contact-address-fields">{([{ name: 'line1', label: 'Adresse', placeholder: 'Numéro et nom de voie' }, { name: 'line2', label: 'Complément', placeholder: 'Bâtiment, étage…' }, { name: 'postal_code', label: 'Code postal', placeholder: '75001' }, { name: 'city', label: 'Ville', placeholder: 'Paris' }, { name: 'country', label: 'Pays', placeholder: '' }, { name: 'state_region', label: 'Région / État', placeholder: 'Facultatif' }] as const).map((field) => <label key={field.name} htmlFor={`${current.key}-${field.name}`}>{field.label}{field.name === 'country' ? <ReferencePicker id={`${current.key}-country`} catalog="settings_countries" label="Pays de l’adresse" value={current.input.country} onChange={(value) => onChange(current.key, { ...current.input, country: value })} /> : <HInput id={`${current.key}-${field.name}`} placeholder={field.placeholder} value={current.input[field.name]} onChange={(event) => onChange(current.key, { ...current.input, [field.name]: event.target.value })} />}</label>)}</div>}
      {!current.virtual && <label className="contact-checkbox"><input type="checkbox" checked={current.input.is_primary || false} onChange={(event) => onChange(current.key, { ...current.input, is_primary: event.target.checked })} />Adresse principale pour cet usage</label>}
    </section>}
  </section>
}
