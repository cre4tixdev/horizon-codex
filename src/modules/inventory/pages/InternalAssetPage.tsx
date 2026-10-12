import { useRecordWorkspace } from '../../../shared/records/recordContext'
import { useState, useSyncExternalStore } from 'react'
import { useForm } from 'react-hook-form'
import { useParams, useLocation, Link } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Boxes, Undo2, PackagePlus, StickyNote, ChevronDown, ChevronRight } from 'lucide-react'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { hrService } from '../../hr/services/HrService'
import { employeeName } from '../../hr/schemas/employees'
import { HPageBreadcrumb } from '../../../shared/ui/HPageBreadcrumb'
import { HPageHeader } from '../../../shared/ui/HPageHeader'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HRecordPageActions } from '../../../shared/ui/HRecordPageActions'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HSaveButton } from '../../../shared/ui/HSaveButton'
import { HButton } from '../../../shared/ui/HButton'
import { HFieldLabel } from '../../../shared/ui/HFieldLabel'
import { HInput } from '../../../shared/ui/HInput'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { ActivityPanel } from '../../../shared/activity/ActivityPanel'
import { internalAssetsService } from '../services/InternalAssetsService'
import { operationsService } from '../services/OperationsService'
import { internalAssetInputSchema, internalAssetStates, type InternalAsset, type InternalAssetInput } from '../schemas/internalAssets'
import { useStockAccess } from '../hooks/useStockAccess'
import '../stock-operations.css'
export function InternalAssetPage() {
  const { id = '' } = useParams(), access = useStockAccess()
  const query = useQuery({ queryKey: ['inventory', 'asset', access.accessKey, id], queryFn: () => internalAssetsService.record(id), enabled: access.canRead, retry: false })
  if (!access.canRead) return <p className="contact-muted">Accès au stock nécessaire.</p>
  if (query.error) return <p role="alert" className="field-error">{query.error.message}<HButton onClick={() => void query.refetch()}>Réessayer</HButton></p>
  return query.data ? <InternalAssetEditor key={query.data.updated} asset={query.data} /> : <HLoadingIndicator label="Chargement du matériel" />
}
function InternalAssetEditor({ asset }: { asset: InternalAsset }) {
  const { state } = useLocation(), openRecord = useRecordWorkspace()
  const initial = internalAssetInputSchema.parse({ ...asset, status: asset.status === 'returned' ? 'stored' : asset.status }), form = useForm<InternalAssetInput>({ defaultValues: initial }), access = useStockAccess(), client = useQueryClient(), session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  // eslint-disable-next-line react-hooks/incompatible-library
  const values = form.watch(), dirty = form.formState.isDirty, [confirm, setConfirm] = useState(false), [error, setError] = useState(''), [notes, setNotes] = useState(false)
  const choices = useQuery({ queryKey: ['inventory', 'operation-choices'], queryFn: () => operationsService.choices(), retry: false }), canHr = session.status === 'authenticated' && hasPermission(session.user, 'hr.read')
  const hr = useQuery({ queryKey: ['hr', 'directory', access.accessKey], queryFn: () => hrService.directory(), enabled: canHr, retry: false })
  const mutation = useMutation({ mutationFn: (action: 'save' | 'return_stock') => internalAssetsService.save(asset.id, asset.updated, form.getValues(), action), onSuccess: async (saved) => { client.setQueryData(['inventory', 'asset', access.accessKey, saved.id], saved); await Promise.all([client.invalidateQueries({ queryKey: ['inventory'] }), client.invalidateQueries({ queryKey: ['accounting'] }), client.invalidateQueries({ queryKey: ['activity'] })]) } })
  const editable = access.canWrite && asset.active, busy = mutation.isPending, formId = 'internal-asset-form'
  return <div className="contact-record"><HPageBreadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Parc interne', href: `/inventory/assets${state?.assetListQuery ? `?${state.assetListQuery}` : ''}` }, { label: asset.number }]} /><HPageHeader title={asset.number} description={`${asset.name} · ${internalAssetStates[asset.status]}`} /><HRecordPageActions placement="workflow">{editable && access.canValidate && !asset.financial_lock && <HButton disabled={dirty || busy} onClick={() => setConfirm(true)}><PackagePlus size={14} />Remettre en stock</HButton>}</HRecordPageActions><HRecordPageActions><HButton size="icon" variant="ghost" aria-label="Annuler les modifications" disabled={!dirty || busy} onClick={() => form.reset(initial)}><Undo2 size={14} /></HButton><HSaveButton form={formId} hasChanges={dirty} pending={busy} disabled={!editable} /></HRecordPageActions>
    <form id={formId} className="purchasing-form" onSubmit={form.handleSubmit((input) => { const parsed = internalAssetInputSchema.safeParse(input); if (!parsed.success) { setError('Vérifiez le nom, l’entrepôt et l’emplacement.'); return }; setError(''); mutation.mutate('save') })}>
      <section className="contact-panel"><HSectionHeading title="Matériel et affectation" icon={Boxes} /><fieldset disabled={!editable || busy} className="stock-operation-fields"><label className="stock-field-wide"><HFieldLabel required>Nom</HFieldLabel><HInput maxLength={200} required {...form.register('name')} /></label><label><HFieldLabel>Produit</HFieldLabel><HInput readOnly value={`${asset.brand} · ${asset.reference}`} /></label><label><HFieldLabel>Lot / Série</HFieldLabel><HInput readOnly value={asset.serial_number || asset.lot_number || 'Sans suivi'} /></label>
      <label><HFieldLabel required>Entrepôt</HFieldLabel><HCombobox label="Entrepôt du matériel" clearable={false} showCodes={false} required value={values.warehouse} options={(choices.data?.warehouses || []).map((item) => ({ value: item.id, label: item.name }))} onChange={(warehouse) => { form.setValue('warehouse', warehouse, { shouldDirty: true }); form.setValue('location', choices.data?.locations.find((item) => item.warehouse === warehouse)?.id || '', { shouldDirty: true }) }} /></label><label><HFieldLabel required>Emplacement</HFieldLabel><HCombobox label="Emplacement du matériel" showCodes={false} clearable={false} required value={values.location} options={(choices.data?.locations || []).filter((item) => item.warehouse === values.warehouse).map((item) => ({ value: item.id, label: item.name }))} onChange={(value) => form.setValue('location', value, { shouldDirty: true })} /></label><label><HFieldLabel>État</HFieldLabel><HCombobox label="État du matériel" showCodes={false} clearable={false} value={values.status} options={Object.entries(internalAssetStates).filter(([value]) => value !== 'returned').map(([value, label]) => ({ value, label, disabled: value === 'retired' && asset.financial_lock }))} onChange={(value) => { const status = internalAssetInputSchema.shape.status.safeParse(value); if (status.success) form.setValue('status', status.data, { shouldDirty: true }) }} /></label><label><HFieldLabel>Date d’entrée au parc</HFieldLabel><HInput readOnly value={new Date(asset.acquired_at).toLocaleDateString('fr-FR')} /></label>
      {canHr && asset.can_assign && <><label><HFieldLabel>Collaborateur</HFieldLabel><HCombobox label="Collaborateur affectataire" showCodes={false} value={values.assigned_employee} options={(hr.data?.employees || []).map((item) => ({ value: item.id, label: employeeName(item) }))} onChange={(value) => form.setValue('assigned_employee', value, { shouldDirty: true })} /></label><label><HFieldLabel>Équipe</HFieldLabel><HCombobox label="Équipe affectataire" showCodes={false} value={values.assigned_team} options={(hr.data?.teams || []).map((item) => ({ value: item.id, label: item.name }))} onChange={(value) => form.setValue('assigned_team', value, { shouldDirty: true })} /></label></>}
      </fieldset><p className="contact-muted">Provenance : <Link to={`/inventory/operations/${asset.source_operation}`}>{asset.source_number}</Link>{asset.receipt_number && ` · Réception ${asset.receipt_number}`}{asset.purchase_order && <HButton variant="ghost" size="small" onClick={() => { if (openRecord) void openRecord({ resource: 'purchase-order', id: asset.purchase_order }).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'La commande ne peut pas être ouverte.')) }}>Commande fournisseur</HButton>}</p>{asset.financial_lock && <p className="contact-muted">Immobilisation enregistrée : le déclassement financier précède le retrait du parc ou la remise en stock.</p>}</section>
      <section className="contact-panel quote-notes-panel purchasing-notes-panel"><HSectionHeading title="Notes internes" icon={StickyNote} actions={<HButton variant="ghost" size="icon" aria-label={notes ? 'Replier les notes internes' : 'Déplier les notes internes'} onClick={() => setNotes(!notes)}>{notes ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</HButton>} /><textarea className="h-input" rows={3} hidden={!notes} aria-label="Notes internes du matériel" disabled={!editable || busy} {...form.register('notes')} /></section>{(error || mutation.error || choices.error || hr.error) && <p role="alert" className="field-error">{error || mutation.error?.message || choices.error?.message || hr.error?.message}</p>}
    </form><ActivityPanel source={{ entity: 'inventory_internal_assets', id: asset.id }} editable={editable} />{confirm && <HDialog open title="Remettre ce matériel en stock" description="Un retour lié sera enregistré. Le matériel quittera le parc interne et redeviendra disponible dans son emplacement." onOpenChange={setConfirm}><div className="dialog-form">{mutation.error && <p role="alert" className="field-error">{mutation.error.message}</p>}<HDialogFooter><HButton variant="primary" disabled={busy} onClick={() => mutation.mutate('return_stock')}><PackagePlus size={14} />Remettre en stock</HButton></HDialogFooter></div></HDialog>}
  </div>
}
