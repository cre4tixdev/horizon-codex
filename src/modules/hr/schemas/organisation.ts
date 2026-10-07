import type { Employee } from './employees'
export type OrganisationNode = { employee: Employee; children: OrganisationNode[] }
export function organisationTree(employees: Employee[]): OrganisationNode[] {
  const ids = new Set(employees.map((item) => item.id))
  const children = new Map<string, Employee[]>()
  for (const item of employees) { const parent = ids.has(item.manager) && item.manager !== item.id ? item.manager : ''; children.set(parent, [...(children.get(parent) || []), item]) }
  const visited = new Set<string>()
  function nodes(parent: string): OrganisationNode[] { return (children.get(parent) || []).flatMap((employee) => { if (visited.has(employee.id)) return []; visited.add(employee.id); return [{ employee, children: nodes(employee.id) }] }) }
  const roots = nodes('')
  // Defensive rendering of malformed historical data; server rejects new cycles.
  for (const employee of employees) if (!visited.has(employee.id)) { visited.add(employee.id); roots.push({ employee, children: nodes(employee.id) }) }
  return roots
}
