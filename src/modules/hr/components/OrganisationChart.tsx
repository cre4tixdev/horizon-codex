import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Minus, Plus, Focus, ChevronDown, ChevronRight, UserRound } from 'lucide-react'
import { HButton } from '../../../shared/ui/HButton'
import { IdentityTag } from '../../settings'
import { organisationTree, type OrganisationNode } from '../schemas/organisation'
import { employeeName, type Employee } from '../schemas/employees'
import { EmployeeAvatar } from './EmployeeAvatar'
export function OrganisationChart({ employees, teams, onSelect }: { employees: Employee[]; teams: { id: string; name: string }[]; onSelect: (employee: Employee) => void }) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [zoom, setZoom] = useState(1)
  const container = useRef<HTMLDivElement>(null)
  const roots = useMemo(() => organisationTree(employees), [employees])
  const structure = employees.map((employee) => `${employee.id}:${employee.manager}`).join('|')
  useLayoutEffect(() => { const viewport = container.current; if (viewport) viewport.scrollLeft = Math.max(0, (viewport.scrollWidth - viewport.clientWidth) / 2) }, [structure, zoom])
  function toggle(id: string) { setCollapsed((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next }) }
  function node(item: OrganisationNode) {
    const { employee, children } = item
    const closed = collapsed.has(employee.id)
    return <li key={employee.id}><article className="hr-org-card"><div className="hr-org-person"><EmployeeAvatar employee={employee} /><div><button type="button" className="hr-org-name" onClick={() => onSelect(employee)} title={employeeName(employee)}>{employeeName(employee)}</button><small title={employee.job_title}>{employee.job_title || 'Poste non renseigné'}</small></div>{children.length > 0 && <HButton className="hr-org-fold" size="icon" variant="ghost" aria-label={`${closed ? 'Déplier' : 'Replier'} ${employeeName(employee)}`} aria-expanded={!closed} onClick={() => toggle(employee.id)}>{closed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}</HButton>}</div><p>{teams.find((team) => team.id === employee.team)?.name || 'Sans équipe'}</p><footer>{employee.is_direction ? <IdentityTag kind="direction">Direction · {children.length}</IdentityTag> : employee.is_manager ? <IdentityTag kind="manager">Manager · {children.length}</IdentityTag> : <IdentityTag kind="collaborator">Collaborateur</IdentityTag>}{employee.has_account && <UserRound size={14} aria-label="Compte Horizon lié" ><title>Compte Horizon lié</title></UserRound>}</footer></article>{children.length > 0 && !closed && <ul>{children.map(node)}</ul>}</li>
  }
  return <div className="hr-org"><div className="hr-org-toolbar"><span className="contact-muted">Responsable principal et collaborateurs · {employees.length} ressources visibles</span><div><HButton size="icon" variant="ghost" aria-label="Réduire l’organigramme" disabled={zoom <= 0.7} onClick={() => setZoom((value) => Math.max(0.7, value - 0.1))}><Minus size={15} /></HButton><small>{Math.round(zoom * 100)} %</small><HButton size="icon" variant="ghost" aria-label="Agrandir l’organigramme" disabled={zoom >= 1.4} onClick={() => setZoom((value) => Math.min(1.4, value + 0.1))}><Plus size={15} /></HButton><HButton size="icon" variant="ghost" aria-label="Recentrer l’organigramme" onClick={() => { setZoom(1); container.current?.scrollTo({ left: Math.max(0, (container.current.scrollWidth - container.current.clientWidth) / 2), top: 0, behavior: 'smooth' }) }}><Focus size={15} /></HButton></div></div><div ref={container} className="hr-org-viewport" tabIndex={0} aria-label="Organigramme des ressources"><div className="hr-org-tree" style={{ zoom }}><ul>{roots.map(node)}</ul></div>{roots.length === 0 && <p className="contact-muted">Aucune ressource correspondant aux filtres.</p>}</div></div>
}
