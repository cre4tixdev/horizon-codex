import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useBlocker } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, LayoutGrid, Pencil, Plus, RotateCcw, Star, Trash2, X, Check, ChevronRight, Search, ArrowLeft } from 'lucide-react'
import { HButton } from '../../../shared/ui/HButton'
import { DropdownMenu } from 'radix-ui'
import { HActionMenu } from '../../../shared/ui/HActionMenu'
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
export function DashboardWorkspace({ userId, renderWidget, header }: { header: (actions: ReactNode, title?: ReactNode) => ReactNode; userId: string; renderWidget: (widget: DashboardWidget, editing: boolean, dashboardId: string) => ReactNode }) {
  const settingsButton = useRef<HTMLButtonElement>(null), nameInput = useRef<HTMLInputElement>(null), searchInput = useRef<HTMLInputElement>(null)
  const client = useQueryClient(), queryKey = ['dashboard', 'layouts', userId]
  const layouts = useQuery({ queryKey, queryFn: () => dashboardService.layouts(), enabled: Boolean(userId), retry: false, staleTime: 30_000, refetchOnWindowFocus: false })
  const [selection, setSelection] = useState<string | null>(null), [editor, setEditor] = useState<Editor | null>(null), [error, setError] = useState(''), [dialog, setDialog] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [dashboardSearch, setDashboardSearch] = useState('')
  const [menuView, setMenuView] = useState<'actions' | 'switch' | 'create'>('actions')
  useEffect(() => { if (menuView === 'switch') searchInput.current?.focus() }, [menuView])
  const choices = [defaultDashboard, ...(layouts.data?.preference.dashboards || [])]
  const normalize = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase()
  const matching = choices.filter((item) => normalize(item.name).includes(normalize(dashboardSearch)))
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
    setDialog(null)
    setMenuOpen(false)
    setEditor({ base: layouts.data, dashboard: { ...current, id: copy || current.id === 'horizon' ? crypto.randomUUID() : current.id, name: copy || current.id === 'horizon' ? `${current.name === 'Horizon' ? 'Mon dashboard' : current.name + ' · copie'}`.slice(0, 80) : current.name, widgets: structuredClone(placeWidgets(current.widgets)) } })
  }
  function create(fromTemplate: boolean) {
    if (!layouts.data) return
    setError(''); setMenuOpen(false)
    setEditor({ base: layouts.data, dashboard: { id: crypto.randomUUID(), name: 'Nouveau dashboard', widgets: fromTemplate ? structuredClone(placeWidgets(defaultDashboard.widgets)) : [] } })
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
    if (!exists && base.dashboards.length >= 12) { setError('Vous avez déjà 12 dashboards. Supprimez-en un avant d’en créer un autre.'); return }
    void persist({ ...base, dashboards: exists ? base.dashboards.map((item) => item.id === parsed.data.id ? parsed.data : item) : [...base.dashboards, parsed.data] }, editor.base.revision, parsed.data.id)
  }
  const configured = shown.widgets.find((widget) => widget.id === dialog)
  const identity = editor && <div className="dashboard-workspace-identity"><LayoutGrid size={16} aria-hidden="true" /><HInput ref={nameInput} aria-label="Nom du dashboard" maxLength={80} value={editor.dashboard.name} disabled={mutation.isPending} onChange={(event) => setEditor({ ...editor, dashboard: { ...editor.dashboard, name: event.target.value } })} /></div>
  const actions = editor ? <div className="dashboard-header-edit-actions" role="group" aria-label="Édition du dashboard">
    <HButton size="icon" title="Ajouter un widget" aria-label="Ajouter un widget" disabled={mutation.isPending} onClick={() => setDialog('add')}><Plus size={15} /></HButton>
    <HButton size="icon" title="Restaurer les widgets Horizon dans cette copie" aria-label="Restaurer les widgets Horizon" disabled={mutation.isPending} onClick={() => changeWidgets(defaultDashboard.widgets.map((widget) => ({ ...widget })))}><RotateCcw size={15} /></HButton>
    <HButton size="icon" title="Annuler les modifications" aria-label="Annuler" disabled={mutation.isPending} onClick={() => setDialog('cancel')}><X size={15} /></HButton>
    <HSaveButton size="icon" aria-label="Enregistrer" title="Enregistrer" hasChanges pending={mutation.isPending} onClick={save}><span className="sr-only">Enregistrer</span></HSaveButton>
  </div> : <HActionMenu label="Gérer les dashboards" menuLabel="Mes dashboards" triggerRef={settingsButton} open={menuOpen} onOpenChange={(open) => { setMenuOpen(open); setMenuView('actions'); setDashboardSearch('') }} disabled={!layouts.data || mutation.isPending} onCloseAutoFocus={(event) => { if (nameInput.current) { event.preventDefault(); nameInput.current.focus() } else if (dialog) event.preventDefault() }}>
    {menuView !== 'actions' ? <>
      <DropdownMenu.Item onSelect={(event) => { event.preventDefault(); setMenuView('actions'); setDashboardSearch('') }}><ArrowLeft size={15} />{menuView === 'switch' ? 'Mes dashboards' : 'Nouveau dashboard'}</DropdownMenu.Item>
      <DropdownMenu.Separator className="user-menu-separator" />
      {menuView === 'switch' ? <>
        <div className="h-combobox-search dashboard-switcher-search"><Search size={14} aria-hidden="true" /><HInput ref={searchInput} aria-label="Rechercher un dashboard" placeholder="Rechercher un dashboard…" value={dashboardSearch} onChange={(event) => setDashboardSearch(event.target.value)} onKeyDown={(event) => { if (event.key !== 'Escape' && event.key !== 'Tab') event.stopPropagation(); if (event.key === 'ArrowDown') { event.preventDefault(); event.currentTarget.closest('[role=menu]')?.querySelector<HTMLElement>('[role=menuitemradio]')?.focus() } }} /></div>
        <DropdownMenu.RadioGroup className="dashboard-menu-choices" aria-label="Dashboard à afficher" value={current.id} onValueChange={setSelection}>
          {matching.map((item) => <DropdownMenu.RadioItem key={item.id} value={item.id}><span className="dashboard-menu-check"><DropdownMenu.ItemIndicator><Check size={15} /></DropdownMenu.ItemIndicator></span><span>{item.name}{item.id === preference?.defaultId ? ' · par défaut' : ''}</span></DropdownMenu.RadioItem>)}
          {matching.length === 0 && <p className="dashboard-switcher-empty">Aucun dashboard trouvé.</p>}
        </DropdownMenu.RadioGroup>
      </> : <>
        <DropdownMenu.Item onSelect={() => create(false)}><Plus size={15} />Dashboard vide</DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => create(true)}><LayoutGrid size={15} />À partir du modèle Horizon</DropdownMenu.Item>
        {current.id !== 'horizon' && <DropdownMenu.Item onSelect={() => start(true)}><Copy size={15} />À partir de ce dashboard</DropdownMenu.Item>}
      </>}
    </> : <>
    <DropdownMenu.Label className="h-action-menu-label dashboard-menu-current">{current.name}{current.id === preference?.defaultId && <Star size={12} aria-label="Par défaut" />}</DropdownMenu.Label>
    <DropdownMenu.Item className="dashboard-menu-edit" aria-label="Modifier ce dashboard" disabled={mutation.isPending || current.id === 'horizon' && (preference?.dashboards.length || 0) >= 12} onSelect={() => start(false)}><Pencil size={16} /><span>Modifier ce dashboard</span></DropdownMenu.Item>
    <DropdownMenu.Separator className="user-menu-separator" />
    <DropdownMenu.Item onSelect={(event) => { event.preventDefault(); setMenuView('switch') }}><LayoutGrid size={15} />Changer de dashboard<ChevronRight size={14} className="dashboard-menu-chevron" /></DropdownMenu.Item>
    <DropdownMenu.Item disabled={(preference?.dashboards.length || 0) >= 12} onSelect={(event) => { event.preventDefault(); setMenuView('create') }}><Plus size={15} />Ajouter un dashboard<ChevronRight size={14} className="dashboard-menu-chevron" /></DropdownMenu.Item>
    {(preference?.dashboards.length || 0) >= 12 && <DropdownMenu.Label className="h-action-menu-label">Limite de 12 dashboards atteinte</DropdownMenu.Label>}
    <DropdownMenu.Separator className="user-menu-separator" />
    <DropdownMenu.Item aria-label="Définir comme dashboard par défaut" disabled={mutation.isPending || preference?.defaultId === current.id} onSelect={(event) => { event.preventDefault(); if (layouts.data) void persist({ ...layouts.data.preference, defaultId: current.id }, layouts.data.revision, current.id) }}><Star size={15} fill={preference?.defaultId === current.id ? 'currentColor' : 'none'} />{preference?.defaultId === current.id ? 'Dashboard par défaut' : 'Utiliser par défaut'}</DropdownMenu.Item>
    {current.id !== 'horizon' && <><DropdownMenu.Separator className="user-menu-separator" /><DropdownMenu.Item className="record-action-delete" aria-label="Supprimer ce dashboard" disabled={mutation.isPending} onSelect={() => setDialog('delete')}><Trash2 size={15} />Supprimer</DropdownMenu.Item></>}
    </>}
    {error && <DropdownMenu.Label><p className="field-error" role="alert">{error}</p></DropdownMenu.Label>}
  </HActionMenu>
  return <>
    {header(actions, identity || undefined)}

    {layouts.isPending && <HLoadingIndicator label="Chargement de vos dashboards" />}
    {(error || layouts.isError) && <div className="dashboard-data-error" role="alert"><span>{error || layouts.error?.message}</span><HButton size="small" disabled={mutation.isPending} onClick={() => { if (editor) setDialog('cancel'); else { setError(''); void layouts.refetch() } }}>Recharger les dispositions</HButton></div>}
    {!layouts.isPending && <div className="dashboard-workspace-canvas" aria-busy={mutation.isPending} inert={mutation.isPending}><DashboardGrid widgets={shown.widgets} editing={Boolean(editor)} onChange={changeWidgets} onConfigure={setDialog} renderWidget={(widget, editing) => renderWidget(widget, editing, shown.id)} />{shown.widgets.length === 0 && <div className="dashboard-widget-empty"><LayoutGrid size={24} /><p>Aucun widget dans ce dashboard.</p>{editor && <HButton size="small" onClick={() => setDialog('add')}>Ajouter un widget</HButton>}</div>}</div>}
    {dialog === 'add' && <WidgetCatalog full={shown.widgets.length >= 32} onClose={() => setDialog(null)} onAdd={(type) => { const widget = createWidget(type); changeWidgets(placeWidgets([...shown.widgets, widget])); setDialog(widget.id) }} />}
    {configured && <WidgetSettings key={configured.id} widget={configured} onChange={(next) => changeWidgets(positionWidget(shown.widgets, next))} onClose={() => setDialog(null)} />}
    <HDialog open={dialog === 'delete'} onOpenChange={(open) => { if (!open) setDialog(null) }} onCloseAutoFocus={() => settingsButton.current?.focus()} title="Supprimer ce dashboard ?" description={`La disposition « ${current.name} » sera supprimée. Les données métier restent conservées.`}>{error && <p className="field-error" role="alert">{error}</p>}<HDialogFooter><HButton disabled={mutation.isPending} onClick={() => setDialog(null)}>Annuler</HButton><HButton variant="primary" disabled={mutation.isPending} onClick={() => { if (layouts.data) void persist({ defaultId: preference?.defaultId === current.id ? 'horizon' : preference!.defaultId, dashboards: preference!.dashboards.filter((item) => item.id !== current.id) }, layouts.data.revision, 'horizon') }}>Supprimer</HButton></HDialogFooter></HDialog>
    <HDialog open={dialog === 'cancel' || blocker.state === 'blocked'} onOpenChange={(open) => { if (!open) { setDialog(null); if (blocker.state === 'blocked') blocker.reset() } }} title="Annuler les modifications ?" description="Les changements de disposition non enregistrés seront perdus."><HDialogFooter><HButton onClick={() => { setDialog(null); if (blocker.state === 'blocked') blocker.reset() }}>Continuer l’édition</HButton><HButton variant="primary" onClick={() => { setEditor(null); setDialog(null); setError(''); if (blocker.state === 'blocked') blocker.proceed(); else void layouts.refetch() }}>Abandonner les modifications</HButton></HDialogFooter></HDialog>
  </>
}
