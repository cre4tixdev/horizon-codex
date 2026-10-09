import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HDialog } from '../../../shared/ui/HDialog'
import { HFieldLabel } from '../../../shared/ui/HFieldLabel'
import { HInput } from '../../../shared/ui/HInput'
import { HSaveButton } from '../../../shared/ui/HSaveButton'
import { catalogService } from '../services/CatalogService'
import type { CatalogChoices } from '../schemas/catalog'

export function BrandPicker({ value, brands, disabled, onChange }: { value: string; brands: CatalogChoices['brands']; disabled: boolean; onChange: (id: string, name: string) => void }) {
  const client = useQueryClient(), [name, setName] = useState<string>()
  const save = useMutation({ mutationFn: () => catalogService.createBrand(name || ''), onSuccess: async (brand) => { await client.invalidateQueries({ queryKey: ['inventory', 'choices'] }); onChange(brand.id, brand.name); setName(undefined) } })
  return <><HCombobox required label="Marque" showCodes={false} value={value} options={brands.map((item) => ({ value: item.id, label: item.name, disabled: !item.active && item.id !== value }))} disabled={disabled} onChange={(id) => onChange(id, brands.find((item) => item.id === id)?.name || '')} create={!disabled ? { label: 'Créer une marque', onClick: (search) => { save.reset(); setName(search) } } : undefined} />
    {name !== undefined && <HDialog open title="Nouvelle marque" description="La marque sera disponible dans le catalogue produits." onOpenChange={(open) => { if (!open && !save.isPending) setName(undefined) }} actions={<HSaveButton form="catalog-brand-form" hasChanges={Boolean(name.trim())} pending={save.isPending}>Créer</HSaveButton>}><form id="catalog-brand-form" className="dialog-form" onSubmit={(event) => { event.preventDefault(); event.stopPropagation(); if (name.trim()) save.mutate() }}><div className="contact-fields catalog-brand-form"><label><HFieldLabel required>Nom de la marque</HFieldLabel><HInput autoFocus required maxLength={160} value={name} disabled={save.isPending} onChange={(event) => setName(event.target.value)} /></label></div>{save.error && <p className="field-error" role="alert">{save.error.message}</p>}</form></HDialog>}
  </>
}
