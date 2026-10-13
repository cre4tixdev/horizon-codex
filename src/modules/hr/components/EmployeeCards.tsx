import { Building2, Mail, Phone } from 'lucide-react'
import { HDirectoryCard } from '../../../shared/ui/HDirectoryCard'
import { IdentityTag } from '../../settings'
import { EmployeeAvatar } from './EmployeeAvatar'
import { employeeName, statusLabels, typeLabels, type Employee, type Team } from '../schemas/employees'

export function EmployeeCards({ employees, teams, onOpen }: { employees: Employee[]; teams: Team[]; onOpen: (employee: Employee) => void }) {
  return <div className="contact-card-grid" aria-label="Employés en cartes">{employees.map((employee) => {
    const name = employeeName(employee)
    const team = teams.find((item) => item.id === employee.team)?.name || 'Sans équipe'
    const responsibility = employee.is_direction ? 'direction' : employee.is_manager ? 'manager' : 'collaborator'
    return <HDirectoryCard key={employee.id} compactTitle
      portrait={<span className="contact-card-portrait"><EmployeeAvatar employee={employee} /></span>}
      title={<button type="button" className="contact-card-title" title={name} aria-label={`Ouvrir la fiche de ${name}`} onClick={() => onOpen(employee)}><span>{name}</span></button>}
      footer={<><div className="contact-role-list"><IdentityTag kind={responsibility}>{employee.is_direction ? 'Direction' : employee.is_manager ? 'Manager' : 'Collaborateur'}</IdentityTag></div><span className="contact-muted employee-card-status" title={`${typeLabels[employee.employment_type]} · ${statusLabels[employee.status]}`}>{typeLabels[employee.employment_type]} · {statusLabels[employee.status]}</span></>}>
      <div className="contact-card-meta">
        {employee.job_title && <p className="contact-card-function" title={employee.job_title}>{employee.job_title}</p>}
        <span className="contact-card-company" title={team}><Building2 size={12} /><span>{team}</span></span>
      </div>
      <div className="contact-card-coordinates">
        {employee.professional_email && <p className="contact-card-primary-coordinate" title={employee.professional_email}><Mail size={14} /><span>{employee.professional_email}</span></p>}
        {employee.professional_phone && <a className={!employee.professional_email ? 'contact-card-primary-coordinate' : undefined} href={`tel:${employee.professional_phone}`} title={employee.professional_phone} aria-label={employee.professional_phone}><Phone size={14} />{!employee.professional_email && <span>{employee.professional_phone}</span>}</a>}
      </div>
    </HDirectoryCard>
  })}</div>
}
