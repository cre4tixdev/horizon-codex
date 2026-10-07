import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { ResultGroup } from './listPresentation'

export function GroupedResults<T>({ groups, icon: Icon, noun = 'fiche(s)', render }: { groups: readonly ResultGroup<T>[]; icon: LucideIcon; noun?: string; render: (items: T[]) => ReactNode }) {
  return <div className="record-groups">{groups.map((group) => <section key={group.key} className="record-group" aria-label={`${group.label} : ${group.total} ${noun}`}><header><h2><Icon size={16} />{group.label}</h2><span>{group.total} {noun}{group.items.length < group.total && <small> · {group.items.length} sur cette page</small>}</span></header>{render(group.items)}</section>)}</div>
}
