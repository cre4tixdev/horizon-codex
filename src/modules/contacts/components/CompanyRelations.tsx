import { useState, type ReactNode } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MapPin, Plus, Pencil } from 'lucide-react'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HButton } from '../../../shared/ui/HButton'
import { HSaveButton } from '../../../shared/ui/HSaveButton'
import { contactsService } from '../services/ContactsService'
import { addressInputSchema, addressLabels, addressValues, roleLabels, roleValues } from '../schemas/contacts'
import { AddressFields } from './AddressFields'
import type { Address, AddressInput } from '../types/contacts'

function AddressForm({ company, address, onClose }: { company: string; address?: Address; onClose: () => void }) {
  const client = useQueryClient()
  const form = useForm<AddressInput>({ defaultValues: { company, type: 'billing', line1: '', line2: '', postal_code: '', city: '', country: '', state_region: '', is_primary: false, ...address } })
  const save = useMutation({ mutationFn: (input: AddressInput) => contactsService.saveAddress(input, address?.id), onSuccess: async () => { await client.cancelQueries({ queryKey: ['contacts'] }); await client.invalidateQueries({ queryKey: ['contacts'] }); onClose() } })
  async function submit(input: AddressInput) {
    if (!form.formState.isDirty || save.isPending) return
    const parsed = addressInputSchema.safeParse(input)
    if (!parsed.success) { for (const issue of parsed.error.issues) { const field = issue.path[0]; if (field === 'line1' || field === 'line2' || field === 'postal_code' || field === 'city' || field === 'country' || field === 'state_region') form.setError(field, { message: issue.message }) }; return }
    await save.mutateAsync(parsed.data).catch(() => {})
  }
  return <form className="contact-extra-address-form" onSubmit={form.handleSubmit(submit)} noValidate>
    <label htmlFor="extra-address-type">Type d’adresse<Controller name="type" control={form.control} render={({ field }) => <HCombobox id="extra-address-type" label="Type d’adresse" value={field.value} onChange={field.onChange} disabled={save.isPending} required showCodes={false} options={addressValues.map((value) => ({ value, label: addressLabels[value] }))} />} /></label>
    <AddressFields form={form} prefix={`extra-address-${address?.id ?? 'new'}`} disabled={save.isPending} />
    <label className="contact-checkbox"><input disabled={save.isPending} type="checkbox" {...form.register('is_primary')} />Adresse principale pour ce type</label>
    {save.error && <p role="alert" className="field-error">{save.error.message}</p>}
    <div className="contact-form-actions"><HSaveButton hasChanges={form.formState.isDirty} pending={save.isPending}>Enregistrer l’adresse</HSaveButton><HButton disabled={save.isPending} onClick={onClose}>Annuler</HButton></div>
  </form>
}

type CompanyRole = typeof roleValues[number]

export function CompanyRoleChoices({ name, selected, disabled, onChange, children }: { name: string; selected: readonly CompanyRole[]; disabled: boolean; onChange: (value: CompanyRole, checked: boolean) => void; children?: ReactNode }) {
  return <section className="contact-panel contact-role-panel" aria-label={`Relations commerciales de ${name}`}><div className="contact-panel-heading"><h2>Relation commerciale</h2></div><div className="contact-role-toggles">{roleValues.map((value) => <label key={value} data-selected={selected.includes(value)}><input type="checkbox" checked={selected.includes(value)} disabled={disabled} onChange={(event) => onChange(value, event.target.checked)} />{roleLabels[value]}</label>)}</div>{children}</section>
}

export function CompanyAddresses({ company, addresses, primaryId, editable }: { company: string; addresses: Address[]; primaryId?: string | undefined; editable: boolean }) {
  const [address, setAddress] = useState<Address | 'new'>()
  const others = addresses.filter((item) => item.id !== primaryId)
  return <section className="contact-panel contact-other-addresses"><div className="contact-section-heading"><div className="contact-panel-heading"><MapPin size={16} /><h2>Autres adresses</h2></div>{editable && !address && <HButton size="small" onClick={() => setAddress('new')}><Plus size={14} />Ajouter une adresse</HButton>}</div><p className="contact-section-description">Facturation, livraison ou autre établissement.</p>
    <div className="contact-address-cards">{others.map((item) => <article key={item.id} className="contact-address"><div><strong>{addressLabels[item.type]}{item.is_primary && ' · Principale'}</strong><p>{item.line1}{item.line2 && <><br />{item.line2}</>}<br />{item.postal_code} {item.city}<br />{item.country}{item.state_region && ` · ${item.state_region}`}</p></div>{editable && <HButton aria-label={`Modifier l’adresse ${item.line1}`} size="icon" onClick={() => setAddress(item)}><Pencil size={14} /></HButton>}</article>)}</div>
    {others.length === 0 && !address && <p className="contact-muted">Aucune autre adresse.</p>}
    {address && <AddressForm key={address === 'new' ? 'new' : address.id} company={company} {...(address === 'new' ? {} : { address })} onClose={() => setAddress(undefined)} />}
  </section>
}
