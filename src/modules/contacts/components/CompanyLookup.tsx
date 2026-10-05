import { useEffect, useRef, useState } from 'react'
import { Dialog } from 'radix-ui'
import { Search, X, Building2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { HButton } from '../../../shared/ui/HButton'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HInput } from '../../../shared/ui/HInput'
import { companyLookupService } from '../services/CompanyLookupService'
import { lookupFieldNames, lookupFieldLabels, type LookupField, type LookupPreview } from '../schemas/companyLookup'

export function CompanyLookup({ getInitialQuery, disabled, onApply }: { getInitialQuery: () => string; disabled: boolean; onApply: (proposal: LookupPreview, fields: LookupField[], includeAddress: boolean) => void }) {
  const searchInput = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [fields, setFields] = useState<LookupField[]>([])
  const [vatNumber, setVatNumber] = useState('')
  const [address, setAddress] = useState(false)
  const search = useMutation({ mutationFn: () => companyLookupService.search(query) })
  const preview = useMutation({ mutationFn: (identifier: string) => companyLookupService.preview(identifier), onSuccess: (proposal) => { setVatNumber(''); setFields(lookupFieldNames.filter((field) => Boolean(proposal.fields[field]))); setAddress(Boolean(proposal.address)) } })
  const busy = disabled || search.isPending || preview.isPending
  useEffect(() => { if (open) searchInput.current?.focus() }, [open])
  function runSearch() { if (busy || query.trim().length < 3) return; preview.reset(); search.mutate() }

  return <Dialog.Root open={open} onOpenChange={(next) => { setOpen(next); if (next) { setQuery(getInitialQuery()); search.reset(); preview.reset(); setFields([]); setAddress(false); setVatNumber('') } }}>
    <Dialog.Trigger asChild><HButton size="small" disabled={disabled}><Search size={14} />Recherche informations</HButton></Dialog.Trigger>
    <Dialog.Portal><Dialog.Overlay className="dialog-overlay" /><Dialog.Content className="dialog-content company-search-dialog">
      <div className="dialog-heading"><div><Dialog.Title>Recherche informations</Dialog.Title><Dialog.Description>Par nom, SIREN ou SIRET · API publique de l’État</Dialog.Description></div><Dialog.Close asChild><HButton size="icon" variant="ghost" aria-label="Fermer la recherche"><X size={16} /></HButton></Dialog.Close></div>
      <div className="company-search-body">
        <p className="contact-muted">Les informations choisies rempliront le formulaire. Cliquez ensuite sur Enregistrer pour les sauvegarder.</p>
        <>
          <div className="company-search-input"><HInput ref={searchInput} aria-label="Nom, SIREN ou SIRET" placeholder="Nom de l’entreprise ou SIRET" value={query} onChange={(event) => { setQuery(event.target.value); search.reset(); preview.reset() }} disabled={busy} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); event.stopPropagation(); runSearch() } }} /><HButton disabled={busy || query.trim().length < 3} onClick={runSearch}><Search size={14} />Rechercher</HButton></div>
          {search.isPending && <p role="status">Recherche en cours…</p>}
          {search.data?.items.length === 0 && <p>Aucune entreprise trouvée. Essayez un autre nom ou vérifiez le SIRET.</p>}
          <div className="company-search-results">{search.data?.items.map((item) => <button key={item.identifier} type="button" disabled={busy} onClick={() => preview.mutate(item.identifier)}><Building2 size={18} aria-hidden="true" /><span><strong>{item.name}</strong><small>{item.siret ? `SIRET ${item.siret}` : `SIREN ${item.identifier}`}{item.address && ` · ${item.address}`}</small></span></button>)}</div>
          {preview.isPending && <p role="status">Chargement des informations…</p>}
          {preview.data && <section className="company-search-proposal" aria-label="Informations disponibles"><h3>Informations à reprendre</h3>{lookupFieldNames.filter((field) => Boolean(preview.data.fields[field])).map((field) => <label key={field}><input type="checkbox" aria-label={`Reprendre ${lookupFieldLabels[field]}`} disabled={busy} checked={fields.includes(field)} onChange={(event) => setFields(event.target.checked ? [...fields, field] : fields.filter((item) => item !== field))} /><span><small>{lookupFieldLabels[field]}</small>{preview.data.fields[field]}</span></label>)}{preview.data.vat_numbers && <div className="company-search-vat"><HCombobox label="Numéro de TVA à reprendre" value={vatNumber} onChange={setVatNumber} options={preview.data.vat_numbers.map((number) => ({ value: number, label: number }))} showCodes={false} /></div>}{preview.data.address && <label><input type="checkbox" aria-label="Reprendre l’adresse" disabled={busy} checked={address} onChange={(event) => setAddress(event.target.checked)} /><span><small>Adresse</small>{preview.data.address.line1}{preview.data.address.line2 && `, ${preview.data.address.line2}`}<br />{preview.data.address.postal_code} {preview.data.address.city} · France</span></label>}</section>}
        </>
        {[search.error, preview.error].filter(Boolean).map((error, i) => <p key={i} role="alert" className="field-error">{error?.message}</p>)}
      </div>
      <div className="company-search-actions"><Dialog.Close asChild><HButton>Annuler</HButton></Dialog.Close><HButton variant={preview.data && (fields.length || address || vatNumber) ? 'primary' : 'secondary'} disabled={busy || !preview.data || (!fields.length && !address && !vatNumber)} onClick={() => { if (!preview.data) return; onApply(vatNumber ? { ...preview.data, fields: { ...preview.data.fields, vat_number: vatNumber } } : preview.data, vatNumber ? [...fields, 'vat_number'] : fields, address); setOpen(false) }}>Remplir le formulaire</HButton></div>
    </Dialog.Content></Dialog.Portal>
  </Dialog.Root>
}
