import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useParams, useLocation, Link } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Landmark, Undo2, Check, Archive, StickyNote, ChevronDown, ChevronRight } from 'lucide-react'
import { HPageBreadcrumb } from '../../../shared/ui/HPageBreadcrumb'
import { HPageHeader } from '../../../shared/ui/HPageHeader'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HRecordPageActions } from '../../../shared/ui/HRecordPageActions'
import { HProgressSteps } from '../../../shared/ui/HProgressSteps'
import { HSaveButton } from '../../../shared/ui/HSaveButton'
import { HButton } from '../../../shared/ui/HButton'
import { HFieldLabel } from '../../../shared/ui/HFieldLabel'
import { HInput } from '../../../shared/ui/HInput'
import { HAmountInput } from '../../../shared/ui/HAmountInput'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { fixedAssetsService } from '../services/FixedAssetsService'
import { useFixedAssetsAccess } from '../hooks/useFixedAssetsAccess'
import { fixedAssetInputSchema, fixedAssetStates, type FixedAsset, type FixedAssetInput } from '../schemas/fixedAssets'
import '../../inventory/stock-operations.css'
export function FixedAssetPage() {
  const { id = '' } = useParams(), access = useFixedAssetsAccess()
  const query = useQuery({ queryKey: ['accounting', 'asset', access.accessKey, id], queryFn: () => fixedAssetsService.record(id), enabled: access.canRead, retry: false })
  if (!access.canRead) return <p className="contact-muted">Accès aux immobilisations nécessaire.</p>
  if (query.error) return <p role="alert" className="field-error">{query.error.message}<HButton onClick={() => void query.refetch()}>Réessayer</HButton></p>
  return query.data ? <FixedAssetEditor key={query.data.updated} asset={query.data} /> : <HLoadingIndicator label="Chargement de l’immobilisation" />
}
function FixedAssetEditor({ asset }: { asset: FixedAsset }) {
  const { state } = useLocation()
  const initial = fixedAssetInputSchema.parse(asset), form = useForm<FixedAssetInput>({ defaultValues: initial }), access = useFixedAssetsAccess(), client = useQueryClient()
  // eslint-disable-next-line react-hooks/incompatible-library
  const values = form.watch(), dirty = form.formState.isDirty, [confirm, setConfirm] = useState<'register' | 'dispose'>(), [error, setError] = useState(''), [notes, setNotes] = useState(false), [reason, setReason] = useState('')
  const mutation = useMutation({ mutationFn: (action: 'save' | 'register' | 'dispose') => fixedAssetsService.save(asset.id, asset.updated, { ...form.getValues(), ...(action === 'dispose' ? { notes: reason } : {}) }, action), onSuccess: async (saved) => { client.setQueryData(['accounting', 'asset', access.accessKey, saved.id], saved); await Promise.all([client.invalidateQueries({ queryKey: ['accounting'] }), client.invalidateQueries({ queryKey: ['inventory'] })]) } })
  const editable = access.canManage && asset.status === 'draft', busy = mutation.isPending, formId = 'fixed-asset-form', steps = ['draft', 'registered', 'disposed'] as const
  return <div className="contact-record"><HPageBreadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Immobilisations', href: `/accounting/assets${state?.assetListQuery ? `?${state.assetListQuery}` : ''}` }, { label: asset.number }]} /><HPageHeader title={asset.name} description={[asset.number, asset.reference, asset.serial_number ? `Série ${asset.serial_number}` : ''].filter(Boolean).join(' · ')} /><HRecordPageActions placement="workflow">{access.canManage && asset.status !== 'disposed' && <HButton disabled={dirty || busy} onClick={() => setConfirm(asset.status === 'draft' ? 'register' : 'dispose')}><Check size={14} />{asset.status === 'draft' ? 'Enregistrer l’immobilisation' : 'Déclasser'}</HButton>}</HRecordPageActions><HRecordPageActions><HButton size="icon" variant="ghost" aria-label="Annuler les modifications" disabled={!dirty || busy} onClick={() => form.reset(initial)}><Undo2 size={14} /></HButton><HSaveButton form={formId} hasChanges={dirty} pending={busy} disabled={!editable} /></HRecordPageActions><HProgressSteps label="Qualification de l’immobilisation" steps={steps.map((id, index) => ({ id, label: fixedAssetStates[id], icon: id === 'draft' ? Landmark : id === 'registered' ? Check : Archive, state: id === asset.status ? 'current' : index < steps.indexOf(asset.status) ? 'done' : 'pending' }))} />
    <form id={formId} className="purchasing-form" onSubmit={form.handleSubmit((input) => { if (!fixedAssetInputSchema.safeParse(input).success) { setError('Vérifiez les valeurs.'); return }; setError(''); mutation.mutate('save') })}><section className="contact-panel"><HSectionHeading title="Qualification comptable" icon={Landmark} /><fieldset disabled={!editable || busy} className="stock-operation-fields"><label><HFieldLabel>Coût d’acquisition HT</HFieldLabel><HAmountInput inlineCurrency currency={asset.currency} value={values.acquisition_cost} onChange={(value) => form.setValue('acquisition_cost', value, { shouldDirty: true })} /></label><label><HFieldLabel>Date d’acquisition</HFieldLabel><HInput type="date" readOnly value={asset.acquisition_date} /></label><label><HFieldLabel required>Mise en service</HFieldLabel><HInput type="date" aria-label="Date de mise en service" {...form.register('in_service_date')} /></label><label><HFieldLabel>Référence comptable / Sage</HFieldLabel><HInput maxLength={160} {...form.register('accounting_reference')} /></label></fieldset><p className="contact-muted"><Link to={`/inventory/assets/${asset.internal_asset}`}>Consulter le matériel dans le parc interne</Link> · Les écritures et amortissements restent suivis dans Sage.</p></section><section className="contact-panel quote-notes-panel purchasing-notes-panel"><HSectionHeading title="Notes internes" icon={StickyNote} actions={<HButton variant="ghost" size="icon" aria-label={notes ? 'Replier les notes internes' : 'Déplier les notes internes'} onClick={() => setNotes(!notes)}>{notes ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</HButton>} /><textarea className="h-input" hidden={!notes} rows={3} aria-label="Notes de l’immobilisation" disabled={!editable || busy} {...form.register('notes')} /></section>{(error || mutation.error) && <p role="alert" className="field-error">{error || mutation.error?.message}</p>}</form>
    {confirm && <HDialog open title={confirm === 'register' ? 'Enregistrer l’immobilisation' : 'Déclasser l’immobilisation'} description={confirm === 'register' ? 'La base d’acquisition et la date de mise en service seront conservées. Cela ne crée pas d’écriture comptable dans Sage.' : 'Le déclassement conserve l’historique et autorise le retrait du parc ou le retour en stock.'} onOpenChange={(open) => { if (!open && !busy) setConfirm(undefined) }}><div className="dialog-form">{confirm === 'dispose' && <label><HFieldLabel required>Motif du déclassement</HFieldLabel><HInput required aria-label="Motif du déclassement" value={reason} maxLength={10000} onChange={(event) => setReason(event.target.value)} /></label>}{mutation.error && <p role="alert" className="field-error">{mutation.error.message}</p>}<HDialogFooter><HButton variant="primary" disabled={busy || confirm === 'dispose' && !reason.trim()} onClick={() => mutation.mutate(confirm)}><Check size={14} />Confirmer</HButton></HDialogFooter></div></HDialog>}
  </div>
}
