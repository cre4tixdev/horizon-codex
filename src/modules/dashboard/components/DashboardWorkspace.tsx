import { useEffect, useState, type ReactNode } from 'react'
import { useBlocker } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, LayoutGrid, Pencil, Plus, RotateCcw, Star, Trash2 } from 'lucide-react'
import { HButton } from '../../../shared/ui/HButton'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HInput } from '../../../shared/ui/HInput'
import { HSaveButton } from '../../../shared/ui/HSaveButton'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { dashboardService } from '../services/DashboardService'
import { defaultDashboard, personalDashboardSchema, widgetCatalog, widgetTypes, type DashboardLayouts, type DashboardPreference, type DashboardWidget, type PersonalDashboard, type WidgetType } from '../schemas/layouts'
import { DashboardGrid } from './DashboardGrid'

type Editor = { base: DashboardLayouts; dashboard: PersonalDashboard }
export function DashboardWorkspace({ userId, renderWidget }: { userId: string; renderWidget: (widget: DashboardWidget) => ReactNode }) {
  const client = useQueryClient(), queryKey = ['dashboard', 'layouts', userId]
  const layouts = useQuery({ queryKey, queryFn: () => dashboardService.layouts(), enabled: Boolean(userId), retry: false, staleTime: 30_000, refetchOnWindowFocus: false })
  const [selection, setSelection] = useState<string | null>(null), [editor, setEditor] = useState<Editor | null>(null), [error, setError] = useState(''), [dialog, setDialog] = useState<'add' | 'delete' | 'cancel' | WidgetType | null>(null)
  const mutation = useMutation({ mutationFn: ({ revision, preference }: DashboardLayouts) => dashboardService.saveLayouts(revision, preference), onSuccess: (data) => client.setQueryData(queryKey, data) })
  const preference = layouts.data?.preference, activeId = selection || preference?.defaultId || 'horizon'
  const current = preference?.dashboards.find((item) => item.id === activeId) || defaultDashboard
  const shown = editor?.dashboard || current, dirty = Boolean(editor)
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname)
  useEffect(() => { if (!dirty) return; const handler = (event: BeforeUnloadEvent) => event.preventDefault(); window.addEventListener('beforeunload', handler); return () => window.removeEventListener('beforeunload', handler) }, [dirty])
  const changeWidgets = (widgets: DashboardWidget[]) => setEditor((value) => value ? { ...value, dashboard: { ...value.dashboard, widgets } } : value)
  function start(copy: boolean) {
    if (!layouts.data) return
    setError('')
    setEditor({ base: layouts.data, dashboard: { ...current, id: copy || current.id === 'horizon' ? crypto.randomUUID() : current.id, name: copy || current.id === 'horizon' ? `${current.name === 'Horizon' ? 'Mon dashboard' : current.name + ' · copie'}`.slice(0, 80) : current.name, widgets: current.widgets.map((widget) => ({ ...widget })) } })
  }
  async function persist(preference: DashboardPreference, revision: number, selected: string) {
    setError('')
    try { await mutation.mutateAsync({ revision, preference }); setSelection(selected); setEditor(null); setDialog(null) }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Enregistrement impossible.') }
  }
  function save() {
    if (!editor) return
    const parsed = personalDashboardSchema.safeParse(editor.dashboard)
    if (!parsed.success) { setError('Donnez un nom de 1 à 80 caractères à ce dashboard.'); return }
    const base = editor.base.preference, exists = base.dashboards.some((item) => item.id === parsed.data.id)
    if (!exists && base.dashboards.length >= 12) { setError('Vous avez déjà 12 dashboards. Supprimez-en un avant de créer une copie.'); return }
    void persist({ ...base, dashboards: exists ? base.dashboards.map((item) => item.id === parsed.data.id ? parsed.data : item) : [...base.dashboards, parsed.data] }, editor.base.revision, parsed.data.id)
  }
  const configured = dialog && widgetTypes.includes(dialog as WidgetType) ? shown.widgets.find((widget) => widget.type === dialog) : undefined
  return <>
    <div className="dashboard-workspace-toolbar">
      <div className="dashboard-workspace-identity"><LayoutGrid size={16} aria-hidden="true" />{editor ? <HInput aria-label="Nom du dashboard" maxLength={80} value={editor.dashboard.name} disabled={mutation.isPending} onChange={(event) => setEditor({ ...editor, dashboard: { ...editor.dashboard, name: event.target.value } })} /> : <HCombobox label="Dashboard à afficher" value={current.id} clearable={false} required showCodes={false} options={[{ value: 'horizon', label: `Horizon${preference?.defaultId === 'horizon' ? ' · par défaut' : ''}` }, ...(preference?.dashboards || []).map((item) => ({ value: item.id, label: item.name + (item.id === preference?.defaultId ? ' · par défaut' : '') }))]} onChange={setSelection} />}</div>
      <div className="dashboard-workspace-actions">{editor ? <><HButton size="small" disabled={mutation.isPending} onClick={() => setDialog('add')}><Plus size={14} />Ajouter un widget</HButton><HButton size="icon" title="Restaurer les widgets Horizon dans cette copie" aria-label="Restaurer les widgets Horizon" disabled={mutation.isPending} onClick={() => changeWidgets(defaultDashboard.widgets.map((widget) => ({ ...widget })))}><RotateCcw size={14} /></HButton><HButton size="small" disabled={mutation.isPending} onClick={() => setDialog('cancel')}>Annuler</HButton><HSaveButton hasChanges pending={mutation.isPending} onClick={save} /></> : <><HButton size="icon" disabled={!layouts.data || mutation.isPending || preference?.defaultId === current.id} aria-label="Définir comme dashboard par défaut" title={preference?.defaultId === current.id ? 'Dashboard par défaut' : 'Définir comme dashboard par défaut'} onClick={() => { if (layouts.data) void persist({ ...layouts.data.preference, defaultId: current.id }, layouts.data.revision, current.id) }}><Star size={15} fill={preference?.defaultId === current.id ? 'currentColor' : 'none'} /></HButton><HButton size="small" disabled={!layouts.data || mutation.isPending || (preference?.dashboards.length || 0) >= 12} onClick={() => start(true)}><Copy size={14} />Dupliquer</HButton>{current.id !== 'horizon' && <HButton size="icon" aria-label="Supprimer ce dashboard" title="Supprimer ce dashboard" disabled={mutation.isPending} onClick={() => setDialog('delete')}><Trash2 size={14} /></HButton>}<HButton size="small" disabled={!layouts.data || mutation.isPending || current.id === 'horizon' && (preference?.dashboards.length || 0) >= 12} onClick={() => start(false)}><Pencil size={14} />Modifier</HButton></>}</div>
    </div>
    {layouts.isPending && <HLoadingIndicator label="Chargement de vos dashboards" />}
    {(error || layouts.isError) && <div className="dashboard-data-error" role="alert"><span>{error || layouts.error?.message}</span><HButton size="small" disabled={mutation.isPending} onClick={() => { if (editor) setDialog('cancel'); else { setError(''); void layouts.refetch() } }}>Recharger les dispositions</HButton></div>}
    {editor && <p className="dashboard-edit-hint">Glissez les poignées pour déplacer les widgets. Étirez le coin inférieur droit pour les redimensionner. Les changements restent en brouillon jusqu’à l’enregistrement.</p>}
    {!layouts.isPending && <div className="dashboard-workspace-canvas" aria-busy={mutation.isPending} inert={mutation.isPending}><DashboardGrid widgets={shown.widgets} editing={Boolean(editor)} onChange={changeWidgets} onConfigure={setDialog} renderWidget={renderWidget} />{shown.widgets.length === 0 && <div className="dashboard-widget-empty"><LayoutGrid size={24} /><p>Aucun widget dans ce dashboard.</p>{editor && <HButton size="small" onClick={() => setDialog('add')}>Ajouter un widget</HButton>}</div>}</div>}
    <HDialog open={dialog === 'add'} onOpenChange={(open) => { if (!open) setDialog(null) }} title="Ajouter un widget" description="Les données affichées respectent vos droits Horizon."><div className="dialog-form dashboard-widget-catalog">{widgetTypes.map((type) => { const definition = widgetCatalog[type], present = shown.widgets.some((widget) => widget.type === type); return <div key={type}><span><strong>{definition.label}</strong><small>{definition.description}</small></span><HButton size="small" disabled={present} onClick={() => { changeWidgets([...shown.widgets, { type, width: definition.width as DashboardWidget['width'], height: definition.height }]); setDialog(null) }}>{present ? 'Ajouté' : 'Ajouter'}</HButton></div> })}</div><HDialogFooter><HButton onClick={() => setDialog(null)}>Fermer</HButton></HDialogFooter></HDialog>
    <HDialog open={Boolean(configured)} onOpenChange={(open) => { if (!open) setDialog(null) }} title={configured ? widgetCatalog[configured.type].label : 'Dimensions du widget'} description="La grille replace les autres widgets automatiquement, sans chevauchement."><div className="dialog-form dashboard-widget-dimensions">{configured && <><label>Largeur<HCombobox label="Largeur du widget" required clearable={false} showCodes={false} value={String(configured.width)} options={[3, 4, 6, 8, 12].filter((width) => width >= widgetCatalog[configured.type].minWidth).map((width) => ({ value: String(width), label: `${width} / 12 colonnes` }))} onChange={(value) => changeWidgets(shown.widgets.map((widget) => widget.type === configured.type ? { ...widget, width: Number(value) as DashboardWidget['width'] } : widget))} /></label><label>Hauteur<HInput aria-label="Hauteur du widget" type="number" min={widgetCatalog[configured.type].minHeight} max={8} value={configured.height} onChange={(event) => { const height = Number(event.target.value); if (Number.isInteger(height) && height >= widgetCatalog[configured.type].minHeight && height <= 8) changeWidgets(shown.widgets.map((widget) => widget.type === configured.type ? { ...widget, height } : widget)) }} /></label></>}</div><HDialogFooter><HButton onClick={() => setDialog(null)}>Terminer</HButton></HDialogFooter></HDialog>
    <HDialog open={dialog === 'delete'} onOpenChange={(open) => { if (!open) setDialog(null) }} title="Supprimer ce dashboard ?" description={`La disposition « ${current.name} » sera supprimée. Les données métier restent conservées.`}>{error && <p className="field-error" role="alert">{error}</p>}<HDialogFooter><HButton disabled={mutation.isPending} onClick={() => setDialog(null)}>Annuler</HButton><HButton variant="primary" disabled={mutation.isPending} onClick={() => { if (layouts.data) void persist({ defaultId: preference?.defaultId === current.id ? 'horizon' : preference!.defaultId, dashboards: preference!.dashboards.filter((item) => item.id !== current.id) }, layouts.data.revision, 'horizon') }}>Supprimer</HButton></HDialogFooter></HDialog>
    <HDialog open={dialog === 'cancel' || blocker.state === 'blocked'} onOpenChange={(open) => { if (!open) { setDialog(null); if (blocker.state === 'blocked') blocker.reset() } }} title="Annuler les modifications ?" description="Les changements de disposition non enregistrés seront perdus."><HDialogFooter><HButton onClick={() => { setDialog(null); if (blocker.state === 'blocked') blocker.reset() }}>Continuer l’édition</HButton><HButton variant="primary" onClick={() => { setEditor(null); setDialog(null); setError(''); if (blocker.state === 'blocked') blocker.proceed(); else void layouts.refetch() }}>Abandonner les modifications</HButton></HDialogFooter></HDialog>
  </>
}
