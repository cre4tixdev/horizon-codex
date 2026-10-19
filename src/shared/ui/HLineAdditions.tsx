import { PackageSearch, Plus } from 'lucide-react'
import { HButton } from './HButton'

export type LineAdditionKind = 'item' | 'section' | 'subsection' | 'subsection3' | 'subtitle' | 'note'
const additions = [['item', 'Ajouter une ligne'], ['section', 'Titre niveau 1'], ['subsection', 'Titre niveau 2'], ['subsection3', 'Titre niveau 3'], ['subtitle', 'Sous-titre'], ['note', 'Note']] as const

export function HLineAdditions({ disabled, onProduct, onAdd, allowItems = true, allowTitles = true }: { disabled: boolean; allowItems?: boolean; allowTitles?: boolean; onProduct?: (() => void) | undefined; onAdd: (kind: LineAdditionKind) => void }) {
  return <div className="quote-line-toolbar quote-line-additions">{onProduct && <HButton variant="ghost" size="small" disabled={disabled} onClick={onProduct}><PackageSearch size={14} /><Plus size={12} />Ajouter un produit</HButton>}{additions.filter(([kind]) => (allowItems || kind !== 'item') && (allowTitles || kind === 'item' || kind === 'note')).map(([kind, label]) => <HButton key={kind} className={`quote-line-add--${kind}`} variant="ghost" size="small" disabled={disabled} onClick={() => onAdd(kind)}><Plus size={13} />{label}</HButton>)}</div>
}
