import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { HButton } from '../../../shared/ui/HButton'
import { HInput } from '../../../shared/ui/HInput'
import { contactsService } from '../services/ContactsService'
import { addressInputSchema, addressLabels, addressValues, roleLabels, roleValues } from '../schemas/contacts'
import type { Address, AddressInput, Company } from '../types/contacts'

function AddressForm({ company, address, onClose }: { company: string; address?: Address | undefined; onClose: () => void }) {
  const client = useQueryClient()
  const form = useForm<AddressInput>({ defaultValues: { company, type: 'registered', line1: '', line2: '', postal_code: '', city: '', country: '', state_region: '', ...address } })
  const save = useMutation({ mutationFn: (input: AddressInput) => contactsService.saveAddress(input, address?.id), onSuccess: async () => { await client.invalidateQueries({ queryKey: ['contacts'] }); onClose() } })
  async function submit(input: AddressInput) {
    const parsed = addressInputSchema.safeParse(input)
    if (!parsed.success) { for (const issue of parsed.error.issues) { const field = issue.path[0]; if (field === 'line1' || field === 'city' || field === 'country') form.setError(field, { message: issue.message }) }; return }
    await save.mutateAsync(parsed.data).catch(() => {})
  }
  return <form className="contact-form-grid contact-address-form" onSubmit={form.handleSubmit(submit)} noValidate>
    <label>Type<select className="h-input" {...form.register('type')}>{addressValues.map((value) => <option key={value} value={value}>{addressLabels[value]}</option>)}</select></label>
    {(['line1', 'line2', 'postal_code', 'city', 'country', 'state_region'] as const).map((field) => <label key={field}>{({ line1: 'Adresse', line2: 'Complément', postal_code: 'Code postal', city: 'Ville', country: 'Code pays', state_region: 'Région / État' })[field]}<HInput {...form.register(field)} aria-invalid={Boolean(form.formState.errors[field])} />{form.formState.errors[field] && <span className="field-error">{form.formState.errors[field]?.message}</span>}</label>)}
    {save.error && <p role="alert" className="field-error">{save.error.message}</p>}
    <div className="contact-form-actions"><HButton type="submit" variant="primary" disabled={save.isPending}>Enregistrer l’adresse</HButton><HButton disabled={save.isPending} onClick={onClose}>Annuler</HButton></div>
  </form>
}
export function CompanyRelations({ company, editable }: { company: Company; editable: boolean }) {
  const client = useQueryClient()
  const [address, setAddress] = useState<Address | 'new'>()
  const addresses = useQuery({ queryKey: ['contacts', 'addresses', company.id], queryFn: () => contactsService.addresses(company.id), retry: false })
  const role = useMutation({ mutationFn: (value: typeof roleValues[number]) => { const current = company.expand?.contacts_company_roles_via_company?.find((item) => item.role === value); return contactsService.saveRole(company.id, value, !current?.active, current?.id) }, onSuccess: () => client.invalidateQueries({ queryKey: ['contacts'] }) })
  return <section className="contact-related"><h2>Rôles de la société</h2><p className="contact-muted">Une même société peut être cliente, fournisseur et partenaire.</p><div className="contact-role-toggles">{roleValues.map((value) => <label key={value}><input type="checkbox" checked={Boolean(company.expand?.contacts_company_roles_via_company?.some((item) => item.role === value && item.active))} disabled={!editable || role.isPending} onChange={() => role.mutate(value)} />{roleLabels[value]}</label>)}</div>{role.isPending && <p role="status">Enregistrement du rôle…</p>}{role.error && <p role="alert" className="field-error">{role.error.message}</p>}
    <div className="contact-section-heading"><h2>Adresses</h2>{editable && !address && <HButton size="small" onClick={() => setAddress('new')}>Ajouter une adresse</HButton>}</div>
    {addresses.isPending && <p role="status">Chargement des adresses…</p>}{addresses.error && <p role="alert" className="field-error">{addresses.error.message}</p>}
    {addresses.data?.map((item) => <div key={item.id} className="contact-address"><div><strong>{addressLabels[item.type]}</strong><p>{item.line1}{item.line2 && ` · ${item.line2}`}<br />{item.postal_code} {item.city} · {item.country}{item.state_region && ` · ${item.state_region}`}</p></div>{editable && <HButton size="small" onClick={() => setAddress(item)}>Modifier l’adresse</HButton>}</div>)}
    {addresses.data?.length === 0 && <p className="contact-muted">Aucune adresse enregistrée.</p>}
    {address && <AddressForm key={address === 'new' ? 'new' : address.id} company={company.id} address={address === 'new' ? undefined : address} onClose={() => setAddress(undefined)} />}
  </section>
}
