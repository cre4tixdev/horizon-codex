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
import { defaultDashboard, personalDashboardSchema, createWidget, placeWidgets, positionWidget, type DashboardLayouts, type DashboardPreference, type DashboardWidget, type PersonalDashboard } from '../schemas/layouts'
import { WidgetCatalog } from './WidgetCatalog'
import { WidgetSettings } from './WidgetSettings'
import { DashboardGrid } from './DashboardGrid'

type Editor = { base: DashboardLayouts; dashboard: PersonalDashboard }
export function DashboardWorkspace({ userId, renderWidget }: { userId: string; renderWidget: (widget: DashboardWidget, editing: boolean, dashboardId: string) => ReactNode }) {
  const client = useQueryClient(), queryKey = ['dashboard', 'layouts', userId]
  const layouts = useQuery({ queryKey, queryFn: () => dashboardService.layouts(), enabled: Boolean(userId), retry: false, staleTime: 30_000, refetchOnWindowFocus: false })
  const [selection, setSelection] = useState<string | null>(null), [editor, setEditor] = useState<Editor | null>(null), [error, setError] = useState(''), [dialog, setDialog] = useState<string | null>(null)
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
    setEditor({ base: layouts.data, dashboard: { ...current, id: copy || current.id === 'horizon' ? crypto.randomUUID() : current.id, name: copy || current.id === 'horizon' ? `${current.name === 'Horizon' ? 'Mon dashboard' : current.name + ' · copie'}`.slice(0, 80) : current.name, widgets: structuredClone(placeWidgets(current.widgets)) } })
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
  const configured = shown.widgets.find((widget) => widget.id === dialog)
  return <>
    <div className="dashboard-workspace-toolbar">
      <div className="dashboard-workspace-identity"><LayoutGrid size={16} aria-hidden="true" />{editor ? <HInput aria-label="Nom du dashboard" maxLength={80} value={editor.dashboard.name} disabled={mutation.isPending} onChange={(event) => setEditor({ ...editor, dashboard: { ...editor.dashboard, name: event.target.value } })} /> : <HCombobox label="Dashboard à afficher" value={current.id} clearable={false} required showCodes={false} options={[{ value: 'horizon', label: `Horizon${preference?.defaultId === 'horizon' ? ' · par défaut' : ''}` }, ...(preference?.dashboards || []).map((item) => ({ value: item.id, label: item.name + (item.id === preference?.defaultId ? ' · par défaut' : '') }))]} onChange={setSelection} />}</div>
      <div className="dashboard-workspace-actions">{editor ? <><HButton size="small" disabled={mutation.isPending} onClick={() => setDialog('add')}><Plus size={14} />Ajouter un widget</HButton><HButton size="icon" title="Restaurer les widgets Horizon dans cette copie" aria-label="Restaurer les widgets Horizon" disabled={mutation.isPending} onClick={() => changeWidgets(defaultDashboard.widgets.map((widget) => ({ ...widget })))}><RotateCcw size={14} /></HButton><HButton size="small" disabled={mutation.isPending} onClick={() => setDialog('cancel')}>Annuler</HButton><HSaveButton hasChanges pending={mutation.isPending} onClick={save} /></> : <><HButton size="icon" disabled={!layouts.data || mutation.isPending || preference?.defaultId === current.id} aria-label="Définir comme dashboard par défaut" title={preference?.defaultId === current.id ? 'Dashboard par défaut' : 'Définir comme dashboard par défaut'} onClick={() => { if (layouts.data) void persist({ ...layouts.data.preference, defaultId: current.id }, layouts.data.revision, current.id) }}><Star size={15} fill={preference?.defaultId === current.id ? 'currentColor' : 'none'} /></HButton><HButton size="small" disabled={!layouts.data || mutation.isPending || (preference?.dashboards.length || 0) >= 12} onClick={() => start(true)}><Copy size={14} />Dupliquer</HButton>{current.id !== 'horizon' && <HButton size="icon" aria-label="Supprimer ce dashboard" title="Supprimer ce dashboard" disabled={mutation.isPending} onClick={() => setDialog('delete')}><Trash2 size={14} /></HButton>}<HButton size="small" disabled={!layouts.data || mutation.isPending || current.id === 'horizon' && (preference?.dashboards.length || 0) >= 12} onClick={() => start(false)}><Pencil size={14} />Modifier</HButton></>}</div>
    </div>
    {layouts.isPending && <HLoadingIndicator label="Chargement de vos dashboards" />}
    {(error || layouts.isError) && <div className="dashboard-data-error" role="alert"><span>{error || layouts.error?.message}</span><HButton size="small" disabled={mutation.isPending} onClick={() => { if (editor) setDialog('cancel'); else { setError(''); void layouts.refetch() } }}>Recharger les dispositions</HButton></div>}
    {editor && <p className="dashboard-edit-hint">Glissez les poignées : la zone pointillée indique la destination. Étirez le coin pour redimensionner. Échap annule le geste. Les changements restent en brouillon jusqu’à l’enregistrement.</p>}
    {!layouts.isPending && <div className="dashboard-workspace-canvas" aria-busy={mutation.isPending} inert={mutation.isPending}><DashboardGrid widgets={shown.widgets} editing={Boolean(editor)} onChange={changeWidgets} onConfigure={setDialog} renderWidget={(widget, editing) => renderWidget(widget, editing, shown.id)} />{shown.widgets.length === 0 && <div className="dashboard-widget-empty"><LayoutGrid size={24} /><p>Aucun widget dans ce dashboard.</p>{editor && <HButton size="small" onClick={() => setDialog('add')}>Ajouter un widget</HButton>}</div>}</div>}
    {dialog === 'add' && <WidgetCatalog full={shown.widgets.length >= 32} onClose={() => setDialog(null)} onAdd={(type) => { const widget = createWidget(type); changeWidgets(placeWidgets([...shown.widgets, widget])); setDialog(widget.id) }} />}
    {configured && <WidgetSettings key={configured.id} widget={configured} onChange={(next) => changeWidgets(positionWidget(shown.widgets, next))} onClose={() => setDialog(null)} />}
    <HDialog open={dialog === 'delete'} onOpenChange={(open) => { if (!open) setDialog(null) }} title="Supprimer ce dashboard ?" description={`La disposition « ${current.name} » sera supprimée. Les données métier restent conservées.`}>{error && <p className="field-error" role="alert">{error}</p>}<HDialogFooter><HButton disabled={mutation.isPending} onClick={() => setDialog(null)}>Annuler</HButton><HButton variant="primary" disabled={mutation.isPending} onClick={() => { if (layouts.data) void persist({ defaultId: preference?.defaultId === current.id ? 'horizon' : preference!.defaultId, dashboards: preference!.dashboards.filter((item) => item.id !== current.id) }, layouts.data.revision, 'horizon') }}>Supprimer</HButton></HDialogFooter></HDialog>
    <HDialog open={dialog === 'cancel' || blocker.state === 'blocked'} onOpenChange={(open) => { if (!open) { setDialog(null); if (blocker.state === 'blocked') blocker.reset() } }} title="Annuler les modifications ?" description="Les changements de disposition non enregistrés seront perdus."><HDialogFooter><HButton onClick={() => { setDialog(null); if (blocker.state === 'blocked') blocker.reset() }}>Continuer l’édition</HButton><HButton variant="primary" onClick={() => { setEditor(null); setDialog(null); setError(''); if (blocker.state === 'blocked') blocker.proceed(); else void layouts.refetch() }}>Abandonner les modifications</HButton></HDialogFooter></HDialog>
  </>
}
