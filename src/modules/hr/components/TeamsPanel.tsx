import { useListTableSorting } from '../../../shared/search/useListTableSorting'
import type { ColumnDef } from '@tanstack/react-table'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { useId, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'
import { Building2, Network, UsersRound } from 'lucide-react'
import { HButton } from '../../../shared/ui/HButton'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HDialog } from '../../../shared/ui/HDialog'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HInput } from '../../../shared/ui/HInput'
import { HSaveButton } from '../../../shared/ui/HSaveButton'
import { HRecordActions } from '../../../shared/ui/HRecordActions'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HBadge } from '../../../shared/ui/HBadge'
import { HTagPicker } from '../../../shared/ui/HTagPicker'
import { GroupedResults } from '../../../shared/search/GroupedResults'
import { groupResults, sortResults } from '../../../shared/search/listPresentation'
import { filterValue } from '../../../shared/search/filters'
import { useIdentityTagStyle } from '../../settings'
import { teamStateFilter, teamGroupingFilter, teamSortFilter } from '../searchFilters'
import { employeeName, timeWorkTypeSchema, type Employee, type Team } from '../schemas/employees'
import { hrService } from '../services/HrService'
import { EmployeeAvatar } from './EmployeeAvatar'

export function TeamsPanel({ teams, employees, onEdit }: { teams: Team[]; employees: Employee[]; onEdit: (team: Team) => void }) {
  const listSorting = useListTableSorting('name:asc', {"Équipe": "name", "Managers": "managers", "Membres visibles": "members", "État": "status"}, 'colon')
  const [params] = useSearchParams()
  const state = filterValue(params, teamStateFilter)
  const grouping = filterValue(params, teamGroupingFilter)
  const search = (params.get('q') || '').toLocaleLowerCase('fr')
  const rows = sortResults(teams.filter((team) => (state === 'all' || team.active === (state === 'active')) && team.name.toLocaleLowerCase('fr').includes(search)), filterValue(params, teamSortFilter), (team, field) => field === 'managers' ? team.managers.map((id) => { const employee = employees.find((item) => item.id === id); return employee ? employeeName(employee) : 'Hors périmètre' }).sort().join(' · ') : field === 'members' ? String(employees.filter((employee) => employee.team === team.id).length) : field === 'status' ? team.active ? 'Active' : 'Archivée' : team.name)
  const columns: ColumnDef<Team>[] = [
    { header: 'Équipe', cell: ({ row }) => <strong>{row.original.name}</strong> },
    { header: 'Managers', cell: ({ row: { original: team } }) => <div className="hr-team-managers">{team.managers.map((id) => { const employee = employees.find((item) => item.id === id); return employee ? <span className="access-person" key={id}><EmployeeAvatar employee={employee} />{employeeName(employee)}</span> : <span className="contact-muted" key={id}>Hors périmètre</span> })}{team.managers.length === 0 && <span className="contact-muted">À désigner</span>}</div> },
    { header: 'Membres visibles', accessorFn: (team) => employees.filter((employee) => employee.team === team.id).length },
    { header: 'État', cell: ({ row: { original: team } }) => <HBadge tone={team.active ? 'success' : 'neutral'}>{team.active ? 'Active' : 'Archivée'}</HBadge> },
    { id: 'time_work_type', header: 'TimeReport', cell: ({ row }) => ({ none: 'Non concernée', be: 'BE · Horizon', production: 'Production · OnSite' })[row.original.time_work_type] },
  ]
  const render = (items: Team[]) => <HDataTable columnSettings={{ id: 'hr.teams', defaultHidden: ['time_work_type'] }} listSorting={listSorting} data={items} columns={columns} getRowAction={(team) => ({ label: `Ouvrir l’équipe ${team.name}`, onClick: () => onEdit(team) })} />

  return <><div className="hr-view-toolbar"><span className="contact-muted">{rows.length} équipe{rows.length === 1 ? '' : 's'}</span></div>{grouping === 'none' ? render(rows) : <GroupedResults groups={groupResults(rows, (team) => ({ key: team.active ? 'active' : 'archived', label: team.active ? 'Actives' : 'Archivées' }))} icon={Building2} noun="équipe(s)" render={render} />}{rows.length === 0 && <p className="contact-muted">Aucune équipe correspondant aux filtres.</p>}</>
}

export function TeamEditor({ record, employees, writable, onClose }: { record: Team | undefined; employees: Employee[]; writable: boolean; onClose: () => void }) {
  const formId = useId()
  const nameId = useId()
  const [workType, setWorkType] = useState(record?.time_work_type || 'none')
  const [name, setName] = useState(record?.name || '')
  const [managers, setManagers] = useState(record?.managers || [])
  const [active, setActive] = useState(record?.active ?? true)
  const tagStyle = useIdentityTagStyle()
  const client = useQueryClient()
  const dirty = workType !== (record?.time_work_type || 'none') || name.trim() !== (record?.name || '') || active !== (record?.active ?? true) || JSON.stringify([...managers].sort()) !== JSON.stringify([...(record?.managers || [])].sort())
  const save = useMutation({ mutationFn: () => hrService.team(name, managers, active, record, workType), onSuccess: async () => { await client.invalidateQueries({ queryKey: ['hr'] }); await client.invalidateQueries({ queryKey: ['time'] }); onClose() } })
  const options = employees.filter((employee) => managers.includes(employee.id) || employee.status === 'active' && (employee.is_manager || employee.is_direction)).map((employee) => ({ value: employee.id, label: employeeName(employee), ...tagStyle(employee.is_direction ? 'direction' : 'manager'), disabled: employee.status !== 'active' || !employee.is_manager && !employee.is_direction }))
  for (const id of managers) if (!options.some((option) => option.value === id)) options.push({ value: id, label: 'Hors périmètre', ...tagStyle('manager'), disabled: true })
  const archive = useMutation({ mutationFn: async () => { if (record) await hrService.team(record.name, record.managers, false, record) }, onSuccess: async () => { await client.invalidateQueries({ queryKey: ['hr'] }); await client.invalidateQueries({ queryKey: ['time'] }); onClose() } })
  const pending = save.isPending || archive.isPending
  return <HDialog open onOpenChange={(open) => { if (!open && !pending) onClose() }} title={record ? record.name : 'Nouvelle équipe'} titleBadge={record && <HBadge tone={active ? 'success' : 'neutral'}>{active ? 'Active' : 'Archivée'}</HBadge>} description="Nommez l’équipe et choisissez les personnes qui l’encadrent." actions={record && writable && <HRecordActions itemName={record.name} active={record.active} disabled={pending} onArchive={() => archive.mutateAsync()} onRestore={() => setActive(true)} {...(dirty ? { archiveDescription: "Ses données et relations seront conservées. Les modifications non enregistrées seront abandonnées." } : {})} />}>
    <form id={formId} className="hr-team-editor dialog-form" onSubmit={(event) => { event.preventDefault(); if (writable && dirty && name.trim() && !pending) save.mutate() }}>
      <div className="hr-team-name-field">
        <HSectionHeading icon={UsersRound} title="Nom de l’équipe" titleFor={nameId} required />
        <HInput id={nameId} required maxLength={120} placeholder="Ex. Bureau d’études" disabled={pending || !writable} value={name} onChange={(event) => setName(event.target.value)} />
      </div>
      <label>TimeReport<HCombobox label="Périmètre de temps de l’équipe" clearable={false} showCodes={false} disabled={pending || !writable} value={workType} options={[{ value: 'none', label: 'Non concernée' }, { value: 'be', label: 'BE · saisie Horizon' }, { value: 'production', label: 'Production · OnSite (à venir)' }]} onChange={(value) => setWorkType(timeWorkTypeSchema.parse(value))} /><small className="contact-muted">Activez ensuite « Saisit ses heures » sur les fiches des employés concernés.</small></label>
      <section aria-label="Encadrement de l’équipe"><HSectionHeading icon={Network} title="Managers" description="Choisissez un ou plusieurs managers ou personnes de Direction." /><HTagPicker label="Managers de l’équipe" addLabel="Choisir les managers…" value={managers} options={options} disabled={pending || !writable} onChange={setManagers} /></section>
      {save.error && <p role="alert" className="field-error">{save.error.message}</p>}
    </form>
    <HDialogFooter><HButton disabled={pending} onClick={onClose}>{writable ? 'Annuler' : 'Fermer'}</HButton>{writable && <HSaveButton form={formId} pending={pending} hasChanges={dirty && Boolean(name.trim())}>Enregistrer</HSaveButton>}</HDialogFooter>
  </HDialog>
}
