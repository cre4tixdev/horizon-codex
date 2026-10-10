import { HSettingsTable } from '../../../shared/ui/HSettingsTable'
import { HRecordPageActions } from '../../../shared/ui/HRecordPageActions'
import { HFieldLabel } from '../../../shared/ui/HFieldLabel'
import { useState, useSyncExternalStore } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, ShieldCheck, UserRound, Network } from 'lucide-react'
import { sessionService } from '../../../core/auth/services/session'
import { accessService } from '../../../core/auth/services/AccessService'
import { accessInputSchema, profileLabels, erpProfiles, scopeLabels, type AccessDirectory, type AccessInput, type AccessUser } from '../../../core/auth/schemas/access'
import { hasPermission } from '../../../core/auth/types/session'
import { HRecordTabs } from '../../../shared/ui/HRecordTabs'
import { IdentityTagsPanel } from '../components/IdentityTagsPanel'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { HButton } from '../../../shared/ui/HButton'
import { HInput } from '../../../shared/ui/HInput'
import { HDialog } from '../../../shared/ui/HDialog'
import { HSaveButton } from '../../../shared/ui/HSaveButton'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { IdentityTag } from '../components/IdentityTag'
import { GroupedResults } from '../../../shared/search/GroupedResults'
import { groupResults, sortResults } from '../../../shared/search/listPresentation'
import { filterValue } from '../../../shared/search/filters'
import { userProfileFilter, userGroupingFilter, userSortFilter } from '../searchFilters'
import { SettingsEditButton } from '../components/SettingsEditButton'
const actionLabels: Record<string, string> = { read: 'Consulter', write: 'Contribuer', 'quote.validate': 'Finaliser un devis', 'order.confirm': 'Confirmer une commande client', 'organisation.manage': 'Gérer la hiérarchie' }
export function UsersAccessPage() {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const [params, setParams] = useSearchParams()
  const allowed = session.status === 'authenticated' && hasPermission(session.user, 'settings.references')
  const admin = session.status === 'authenticated' && session.user.erpProfile === 'admin'
  const tab = !admin || params.get('tab') === 'tags' ? 'tags' : 'users'
  if (!allowed) return <HEmptyState icon={ShieldCheck} title="Utilisateurs et accès" description="Le paramétrage est réservé à Admin et Superuser." />
  return <section className="settings-crm"><HSectionHeading icon={ShieldCheck} title="Utilisateurs et accès" description="Comptes, accréditations et présentation des profils et responsabilités." />
    <HRecordTabs label="Paramètres utilisateurs et accès" idPrefix="settings-users-tab" value={tab} onChange={(next) => setParams((current) => { const updated = new URLSearchParams(current); updated.set('tab', next); updated.delete('q'); return updated })} items={[...(admin ? [{ value: 'users', label: 'Utilisateurs', panel: 'settings-users-panel' }] : []), { value: 'tags', label: 'Tags', panel: 'settings-tags-panel' }]} />
    <div role="tabpanel" id={tab === 'tags' ? 'settings-tags-panel' : 'settings-users-panel'} aria-labelledby={`settings-users-tab-${tab}`}>{tab === 'tags' ? <IdentityTagsPanel /> : <UsersDirectoryPanel />}</div>
  </section>
}

function UsersDirectoryPanel() {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const allowed = session.status === 'authenticated' && session.user.erpProfile === 'admin'
  const query = useQuery({ queryKey: ['access', 'users'], queryFn: accessService.list, enabled: allowed })
  const [params, setParams] = useSearchParams()
  const search = params.get('q') || ''
  const filter = filterValue(params, userProfileFilter)
  const [editor, setEditor] = useState<AccessUser | 'new'>()
  const selected = query.data?.users.find((item) => item.id === params.get('user'))
  const record = editor || selected
  const close = () => { setEditor(undefined); setParams((current) => { const next = new URLSearchParams(current); next.delete('user'); return next }, { replace: true }) }
  if (!allowed) return <HEmptyState icon={ShieldCheck} title="Utilisateurs et accès" description="Seul un Admin peut gérer les comptes et les accréditations." />
  const filteredRows = query.data?.users.filter((item) => (filter === 'all' || item.erp_profile === filter) && `${item.name} ${item.email} ${item.employee_identity?.name || ''}`.toLocaleLowerCase('fr').includes(search.toLocaleLowerCase('fr'))) || []
  const modules = query.data?.modules || []
  const grouping = filterValue(params, userGroupingFilter)
  const rows = sortResults(filteredRows, filterValue(params, userSortFilter), (item, field) => field === 'email' ? item.email : item.name)
  const groups = groupResults(rows, (item) => grouping === 'profile' ? { key: item.erp_profile, label: profileLabels[item.erp_profile] } : { key: item.employee_identity?.is_direction ? 'direction' : item.employee_identity?.is_manager ? 'manager' : 'employee', label: item.employee_identity?.is_direction ? 'Direction' : item.employee_identity?.is_manager ? 'Manager' : 'Collaborateur' })
  const renderTable = (items: AccessUser[]) => <HSettingsTable count={items.length} noun="utilisateur"><table className="reference-table"><thead><tr><th>Utilisateur</th><th>Profil ERP</th><th>Employé</th><th>Responsabilité</th><th>Modules</th><th className="settings-state-cell">État</th><th className="settings-action-cell">Actions</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><div className="access-person"><span className="hr-initials">{item.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('')}</span><span><strong>{item.name}</strong><small>{item.email}</small></span></div></td><td><IdentityTag kind={item.erp_profile}>{profileLabels[item.erp_profile]}</IdentityTag></td><td>{item.employee_identity ? <Link to={`/hr?employee=${item.employee}`}>{item.employee_identity.name}</Link> : <span className="contact-muted">Non rattaché</span>}</td><td>{item.employee_identity?.is_direction ? <IdentityTag kind="direction">Direction</IdentityTag> : item.employee_identity?.is_manager ? <IdentityTag kind="manager">Manager</IdentityTag> : item.employee_identity ? <IdentityTag kind="collaborator">Collaborateur</IdentityTag> : '—'}</td><td>{item.erp_profile === 'admin' ? 'Tous les modules disponibles' : modules.filter((module) => item.grants[module.key]?.actions.includes('read')).map((module) => module.label).join(', ') || 'Aucun'}</td><td className="settings-state-cell">{item.active ? 'Actif' : 'Désactivé'}</td><td className="settings-action-cell"><SettingsEditButton label={item.name} onClick={() => setEditor(item)} /></td></tr>)}</tbody></table></HSettingsTable>
  return <section><div className="settings-crm-heading"><div>{query.data && <div className="access-summary">{query.data.users.length} comptes · {query.data.users.filter((item) => item.active).length} actifs · {query.data.users.filter((item) => item.employee_identity?.is_manager).length} managers · {query.data.users.filter((item) => item.employee_identity?.is_direction).length} directions</div>}</div><HRecordPageActions><HButton variant="primary" disabled={!query.data} onClick={() => setEditor('new')}><Plus size={14} />Nouvel utilisateur</HButton></HRecordPageActions></div>

    {query.isPending && <p role="status">Chargement…</p>}{query.error && <p role="alert">{query.error.message} <HButton size="small" onClick={() => void query.refetch()}>Réessayer</HButton></p>}
    {query.data && <>{grouping === 'none' ? renderTable(rows) : <GroupedResults groups={groups} icon={grouping === 'profile' ? ShieldCheck : Network} noun="compte(s)" render={renderTable} />}{rows.length === 0 && <p className="contact-muted">Aucun utilisateur correspondant.</p>}</>}
    {record && query.data && <UserEditor key={record === 'new' ? 'new' : record.id} {...(record === 'new' ? {} : { record })} directory={query.data} onClose={close} />}
  </section>
}
function UserEditor({ record, directory, onClose }: { record?: AccessUser; directory: AccessDirectory; onClose: () => void }) {
  const [initial] = useState<AccessInput>(record ? { name: record.name, email: record.email, active: record.active, erp_profile: record.erp_profile, employee: record.employee, grants: record.grants, password: '' } : { name: '', email: '', active: true, erp_profile: 'user', employee: '', grants: {}, password: '' })
  const [input, setInput] = useState(initial)
  const [validation, setValidation] = useState('')
  const client = useQueryClient()
  const save = useMutation({ mutationFn: () => accessService.save(input, record), onSuccess: async () => { await client.invalidateQueries({ queryKey: ['access'] }); await client.invalidateQueries({ queryKey: ['hr'] }); await sessionService.refresh(); onClose() } })
  const dirty = JSON.stringify(initial) !== JSON.stringify(input)
  const profile = input.erp_profile
  function changeProfile(value: string) {
    if (!erpProfiles.some((item) => item === value)) return
    const parsed = accessInputSchema.shape.erp_profile.parse(value)
    setInput({ ...input, erp_profile: parsed, grants: parsed === 'viewer' ? Object.fromEntries(Object.entries(input.grants).map(([key, grant]) => [key, { ...grant, actions: grant.actions.includes('read') ? ['read'] : [] }])) : input.grants })
  }
  function action(key: string, value: string, checked: boolean) {
    const current = input.grants[key] || { actions: [], scope: 'all' as const }
    let actions = checked ? [...current.actions, value] : current.actions.filter((item) => item !== value)
    if (value === 'read' && !checked) actions = []
    if (value === 'write' && !checked) actions = actions.filter((item) => item !== 'organisation.manage')
    if (value === 'organisation.manage' && checked && !actions.includes('write')) actions.push('write')
    if (actions.length && !actions.includes('read')) actions.unshift('read')
    setInput({ ...input, grants: { ...input.grants, [key]: { ...current, actions } } })
  }
  return <HDialog open onOpenChange={(open) => { if (!open && !save.isPending) onClose() }} title={record ? `Accès · ${record.name}` : 'Nouvel utilisateur'} description="Le profil ERP contrôle l’administration. Les accréditations définissent les actions métier." ><form className="access-editor" onSubmit={(event) => { event.preventDefault(); const parsed = accessInputSchema.safeParse(input); if (!parsed.success) { setValidation(parsed.error.issues[0]?.message || 'Vérifiez les champs.'); return }; setValidation(''); if (dirty && !save.isPending) save.mutate() }}><fieldset disabled={save.isPending} className="access-fieldset"><HSectionHeading icon={UserRound} title="Compte et identité" /><div className="contact-form-grid"><label><HFieldLabel required>Nom affiché</HFieldLabel><HInput required value={input.name} onChange={(event) => setInput({ ...input, name: event.target.value })} /></label><label><HFieldLabel required>E-mail de connexion</HFieldLabel><HInput required type="email" value={input.email} onChange={(event) => setInput({ ...input, email: event.target.value })} /></label><label><HFieldLabel required>Profil ERP</HFieldLabel><HCombobox label="Profil ERP" value={profile} onChange={changeProfile} required showCodes={false} options={erpProfiles.map((value) => ({ value, label: profileLabels[value] }))} /></label><label>Employé lié<HCombobox label="Employé lié" value={input.employee} onChange={(employee) => setInput({ ...input, employee, name: input.name || directory.employees.find((item) => item.id === employee)?.name || '' })} showCodes={false} options={directory.employees.filter((item) => !directory.users.some((user) => user.employee === item.id && user.id !== record?.id)).map((item) => ({ value: item.id, label: item.name }))} /></label><label><HFieldLabel required={!record}>{record ? 'Nouveau mot de passe (facultatif)' : 'Mot de passe initial'}</HFieldLabel><HInput autoComplete="new-password" type="password" required={!record} minLength={12} maxLength={1024} value={input.password} onChange={(event) => setInput({ ...input, password: event.target.value })} /></label><label className="h-choice"><input type="checkbox" checked={input.active} onChange={(event) => setInput({ ...input, active: event.target.checked })} />Compte actif</label></div></fieldset>
    <HSectionHeading icon={ShieldCheck} title="Accréditations métier" description={profile === 'admin' ? 'Admin dispose des droits des modules disponibles, en respectant leurs règles métier.' : profile === 'viewer' ? 'Consultation uniquement, dans les périmètres choisis.' : 'Choisissez les actions et le périmètre pour chaque module.'} />
    <div className="access-grants-table"><table className="reference-table"><thead><tr><th>Module</th><th>Actions autorisées</th><th>Périmètre</th></tr></thead><tbody>{directory.modules.filter((module) => module.available).map((module) => <tr key={module.key} data-unavailable={!module.available}><td>{module.label}{!module.available && <small className="contact-muted"> · À venir</small>}</td><td><div className="access-actions">{module.available ? module.actions.map((value) => <label key={value} className="h-choice"><input type="checkbox" aria-label={`${module.label} · ${actionLabels[value] || value}`} checked={profile === 'admin' || Boolean(input.grants[module.key]?.actions.includes(value))} disabled={save.isPending || profile === 'admin' || profile === 'viewer' && value !== 'read' || value === 'organisation.manage' && (input.grants[module.key]?.scope || 'all') !== 'all'} onChange={(event) => action(module.key, value, event.target.checked)} />{actionLabels[value] || value}</label>) : 'Disponible lors de la livraison du module'}</div></td><td>{module.available && (module.scopes.length === 1 || profile === 'admin' ? <span>{scopeLabels.all}</span> : <HCombobox label={`Périmètre ${module.label}`} value={input.grants[module.key]?.scope || 'all'} onChange={(scope) => setInput({ ...input, grants: { ...input.grants, [module.key]: { actions: (input.grants[module.key]?.actions || []).filter((action) => scope === 'all' || action !== 'organisation.manage'), scope: scope === 'self' || scope === 'reports' || scope === 'team' ? scope : 'all' } } })} disabled={save.isPending} showCodes={false} required options={module.scopes.map((value) => ({ value, label: scopeLabels[value] }))} />)}</td></tr>)}</tbody></table></div><details className="access-future-modules"><summary>Modules à venir</summary><p>{directory.modules.filter((module) => !module.available).map((module) => module.label).join(' · ')}</p><p>Leurs droits seront disponibles à la livraison de chaque module.</p></details>
    {input.grants.hr && input.grants.hr.scope !== 'all' && !input.employee && <p className="field-error">Rattachez un employé pour utiliser le périmètre hiérarchique ou personnel.</p>}{validation && <p role="alert" className="field-error">{validation}</p>}{save.error && <p role="alert" className="field-error">{save.error.message}</p>}<div className="contact-form-actions"><HButton disabled={save.isPending} onClick={onClose}>Annuler</HButton><HSaveButton hasChanges={dirty} pending={save.isPending}>Enregistrer</HSaveButton></div></form></HDialog>
}
