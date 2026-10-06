import type { ReactNode } from 'react'
import { roleLabels, roleValues } from '../schemas/contacts'

type CompanyRole = typeof roleValues[number]

export function CompanyRoleChoices({ name, selected, disabled, onChange, children }: { name: string; selected: readonly CompanyRole[]; disabled: boolean; onChange: (value: CompanyRole, checked: boolean) => void; children?: ReactNode }) {
  return <section className="contact-panel contact-role-panel" aria-label={`Relations commerciales de ${name}`}><div className="contact-panel-heading"><h2>Relation commerciale</h2></div><div className="contact-role-toggles">{roleValues.map((value) => <label key={value} data-selected={selected.includes(value)}><input type="checkbox" checked={selected.includes(value)} disabled={disabled} onChange={(event) => onChange(value, event.target.checked)} />{roleLabels[value]}</label>)}</div>{children}</section>
}
