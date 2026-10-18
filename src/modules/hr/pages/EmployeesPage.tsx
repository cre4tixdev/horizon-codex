import { useListTableSorting } from '../../../shared/search/useListTableSorting'
import type { ColumnDef } from '@tanstack/react-table'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { useState, useSyncExternalStore } from 'react'
import { useSearchParams } from 'react-router'
import { Plus, List, LayoutGrid, Network, UsersRound, Building2, UserRound } from 'lucide-react'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { HPageHeader } from '../../../shared/ui/HPageHeader'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { EmployeeCards } from '../components/EmployeeCards'
import { HViewSwitch } from '../../../shared/ui/HViewSwitch'
import { HButton } from '../../../shared/ui/HButton'
import { IdentityTag } from '../../settings'
import { GroupedResults } from '../../../shared/search/GroupedResults'
import { groupResults } from '../../../shared/search/listPresentation'
import { filterValue } from '../../../shared/search/filters'
import { employeeStatusFilter, employeeTeamFilter, employeeGroupingFilter, employeeSortFilter } from '../searchFilters'
import { sortEmployeeResults } from '../employeePresentation'
import { useHrDirectory } from '../hooks/useHrDirectory'
import { HRecordTabs } from '../../../shared/ui/HRecordTabs'
import { TeamsPanel, TeamEditor } from '../components/TeamsPanel'
import { EmployeeEditor } from '../components/EmployeeEditor'
import { EmployeeAvatar } from '../components/EmployeeAvatar'
import { OrganisationChart } from '../components/OrganisationChart'
import { employeeName, statusLabels, typeLabels, type Employee, type Team } from '../schemas/employees'
export function EmployeesPage() {
  const listSorting = useListTableSorting('name:asc', {"Collaborateur": "name", "Poste": "job", "Équipe": "team", "Responsable": "manager", "Type": "type", "État": "status", "Compte": "account"}, 'colon')
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const allowed = session.status === 'authenticated' && hasPermission(session.user, 'hr.read')
  const writable = session.status === 'authenticated' && hasPermission(session.user, 'hr.write')
  const organisation = session.status === 'authenticated' && hasPermission(session.user, 'hr.organisation.manage')
  const admin = session.status === 'authenticated' && session.user.erpProfile === 'admin'
  const directory = useHrDirectory(allowed)
  const [params, setParams] = useSearchParams()
  const search = params.get('q') || ''
  const team = filterValue(params, employeeTeamFilter(directory.data?.teams || []))
  const status = filterValue(params, employeeStatusFilter)
  const [editor, setEditor] = useState<Employee | 'new'>()
  const [teamEditor, setTeamEditor] = useState<Team | 'new'>()
  const tab = params.get('tab') === 'teams' ? 'teams' : 'employees'
  const selected = directory.data?.employees.find((item) => item.id === params.get('employee'))
  const edited = editor || selected
  const close = () => { setEditor(undefined); const next = new URLSearchParams(params); next.delete('employee'); setParams(next, { replace: true }) }
  const view = params.get('view') === 'org' ? 'org' : params.get('view') === 'list' ? 'list' : 'cards'
  const filteredRows = directory.data?.employees.filter((item) => (team === 'all' || item.team === team) && (status === 'all' || item.status === status) && `${employeeName(item)} ${item.job_title} ${item.professional_email}`.toLocaleLowerCase('fr').includes(search.toLocaleLowerCase('fr'))) || []
  const employees = directory.data?.employees || []
  const teams = directory.data?.teams || []
  const managerLabel = (item: Employee) => { const manager = employees.find((employee) => employee.id === item.manager); return manager ? employeeName(manager) : item.manager ? 'Hors périmètre' : '—' }
  const grouping = filterValue(params, employeeGroupingFilter)
  const rows = sortEmployeeResults(filteredRows, filterValue(params, employeeSortFilter), (item, field) => field === 'team' ? teams.find((team) => team.id === item.team)?.name || '—' : field === 'manager' ? managerLabel(item) : field === 'type' ? typeLabels[item.employment_type] : field === 'status' ? statusLabels[item.status] : field === 'account' ? item.has_account ? item.account_active ? 'Actif' : 'Désactivé' : 'Sans compte' : field === 'email' ? item.professional_email : item.job_title)
  const groups = groupResults(rows, (item) => grouping === 'team' ? { key: item.team, label: teams.find((team) => team.id === item.team)?.name || 'Sans équipe' } : { key: item.is_direction ? 'direction' : item.is_manager ? 'manager' : 'employee', label: item.is_direction ? 'Direction' : item.is_manager ? 'Manager' : 'Collaborateur' })
  const columns: ColumnDef<Employee>[] = [
    { header: 'Collaborateur', cell: ({ row: { original: item } }) => <div className="access-person"><EmployeeAvatar employee={item} /><span className="h-data-table-record-name">{employeeName(item)}</span><IdentityTag kind={item.is_direction ? 'direction' : item.is_manager ? 'manager' : 'collaborator'}>{item.is_direction ? 'Direction' : item.is_manager ? 'Manager' : 'Collaborateur'}</IdentityTag></div> },
    { header: 'Poste', accessorFn: (item) => item.job_title || '—' },
    { header: 'Équipe', accessorFn: (item) => teams.find((value) => value.id === item.team)?.name || '—' },
    { header: 'Responsable', accessorFn: (item) => { const manager = employees.find((value) => value.id === item.manager); return manager ? employeeName(manager) : item.manager ? 'Hors périmètre' : '—' } },
    { header: 'Type', accessorFn: (item) => typeLabels[item.employment_type] },
    { header: 'État', accessorFn: (item) => statusLabels[item.status] },
    { header: 'Compte', accessorFn: (item) => item.has_account ? item.account_active ? 'Actif' : 'Désactivé' : 'Sans compte' },
    { accessorKey: 'professional_email', header: 'E-mail professionnel', cell: ({ row }) => row.original.professional_email || '—' },
    { accessorKey: 'professional_phone', header: 'Téléphone professionnel', cell: ({ row }) => row.original.professional_phone || '—' },
    { id: 'time_reporting_enabled', header: 'Saisit ses heures', cell: ({ row }) => row.original.time_reporting_enabled ? 'Oui' : 'Non' },
  ]
  const renderTable = (items: Employee[]) => <><HDataTable columnSettings={{ id: 'hr.employees', defaultHidden: ['professional_email', 'professional_phone', 'time_reporting_enabled'] }} listSorting={listSorting} data={items} columns={columns} getRowAction={(item) => ({ label: `Ouvrir la fiche de ${employeeName(item)}`, onClick: () => setEditor(item) })} />{items.length === 0 && <p className="contact-muted">Aucune ressource correspondant aux filtres.</p>}</>
  const renderResults = (items: Employee[]) => view === 'cards' ? items.length > 0 ? <EmployeeCards employees={items} teams={teams} onOpen={setEditor} /> : <p className="contact-muted">Aucune ressource correspondant aux filtres.</p> : renderTable(items)

  if (!allowed) return <HEmptyState icon={UsersRound} title="Employés" description="Vous ne disposez pas de la permission de consulter les ressources." />
  return <div className="hr-page"><HPageHeader title="Employés" description="Vos collaborateurs, ressources externes et responsabilités." actions={<>{tab === 'employees' && writable && organisation && <HButton variant="primary" onClick={() => setEditor('new')}><Plus size={14} />Nouvel employé</HButton>}{tab === 'teams' && directory.data?.can_manage_teams && <HButton variant="primary" onClick={() => setTeamEditor('new')}><Plus size={14} />Nouvelle équipe</HButton>}</>} />

    <HRecordTabs label="Rubriques Employés" idPrefix="hr-tab" value={tab} onChange={(value) => setParams((current) => { const next = new URLSearchParams(current); if (value === "teams") next.set("tab", "teams"); else next.delete("tab"); next.delete("employee"); return next })} items={[{ value: "employees", label: "Employés", icon: UserRound, panel: "hr-employees-panel" }, { value: "teams", label: "Équipes", icon: UsersRound, panel: "hr-teams-panel" }]} />
    {directory.isPending && <p role="status">Chargement…</p>}{directory.error && <p role="alert">{directory.error.message} <HButton size="small" onClick={() => void directory.refetch()}>Réessayer</HButton></p>}
    {directory.data && tab === 'employees' && <div id="hr-employees-panel" role="tabpanel" aria-labelledby="hr-tab-employees"><div className="hr-view-toolbar"><span className="contact-muted">{rows.length} ressources · {rows.filter((item) => item.is_manager).length} managers · {rows.filter((item) => item.is_direction).length} directions</span><HViewSwitch label="Présentation des employés" value={view} items={[{ value: 'cards', label: 'Cartes', icon: LayoutGrid }, { value: 'list', label: 'Liste', icon: List }, { value: 'org', label: 'Organigramme', icon: Network }]} onChange={(value) => setParams((current) => { const next = new URLSearchParams(current); if (value === 'cards') next.delete('view'); else next.set('view', value); return next })} /></div>
    {view === 'org' ? <OrganisationChart employees={rows} teams={directory.data.teams} onSelect={setEditor} /> : grouping === 'none' || rows.length === 0 ? renderResults(rows) : <GroupedResults groups={groups} icon={grouping === 'team' ? Building2 : Network} noun="ressource(s)" render={renderResults} />}</div>}
    {edited && directory.data && <EmployeeEditor key={edited === 'new' ? 'new' : edited.id} {...(edited === 'new' ? {} : { record: edited })} employees={directory.data.employees} teams={directory.data.teams} writable={writable} organisation={organisation} admin={admin} onClose={close} />}
    {directory.data && tab === 'teams' && <div id="hr-teams-panel" role="tabpanel" aria-labelledby="hr-tab-teams"><TeamsPanel teams={teams} employees={employees} onEdit={setTeamEditor} /></div>}
    {teamEditor && directory.data && <TeamEditor record={teamEditor === 'new' ? undefined : teamEditor} employees={employees} writable={directory.data.can_manage_teams} onClose={() => setTeamEditor(undefined)} />}
  </div>
}
