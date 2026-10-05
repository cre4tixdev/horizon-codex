import { Controller, type UseFormReturn } from 'react-hook-form'
import { HInput } from '../../../shared/ui/HInput'
import { ReferencePicker } from './ReferencePicker'
import type { AddressInput } from '../types/contacts'

export function AddressFields({ form, prefix, disabled }: { form: UseFormReturn<AddressInput>; prefix: string; disabled: boolean }) {
  const fields = [
    { name: 'line1', label: 'Adresse', placeholder: 'Numéro et nom de voie', wide: true },
    { name: 'line2', label: 'Complément', placeholder: 'Bâtiment, étage…', wide: true },
    { name: 'postal_code', label: 'Code postal', placeholder: '75001' },
    { name: 'city', label: 'Ville', placeholder: 'Paris' },
    { name: 'country', label: 'Pays', wide: true },
    { name: 'state_region', label: 'Région / État', placeholder: 'Facultatif', wide: true },
  ] as const
  return <div className="contact-address-fields">{fields.map((field) => <label key={field.name} className={'wide' in field && field.wide ? 'contact-wide' : ''} htmlFor={`${prefix}-${field.name}`}>
    {field.label}
    {field.name === 'country' ? <Controller name="country" control={form.control} render={({ field: input }) => <ReferencePicker id={`${prefix}-${field.name}`} catalog="settings_countries" label="Pays" required value={input.value} onChange={input.onChange} disabled={disabled} invalid={Boolean(form.formState.errors.country)} />} /> : <HInput id={`${prefix}-${field.name}`} placeholder={'placeholder' in field ? field.placeholder : undefined} disabled={disabled} {...form.register(field.name)} aria-invalid={Boolean(form.formState.errors[field.name])} />}
    {form.formState.errors[field.name] && <span className="field-error">{form.formState.errors[field.name]?.message}</span>}
  </label>)}</div>
}
