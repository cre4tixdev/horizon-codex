import type { Company, Person } from '../../contacts/types/contacts'
import { useQuery } from '@tanstack/react-query'
import { ContactMergeDialog } from '../../contacts/components/ContactMergeDialog'
import { ProductMergeDialog } from '../../inventory/components/ProductMergeDialog'
import { contactsService } from '../../contacts/services/ContactsService'
import { catalogService } from '../../inventory/services/CatalogService'
import { HButton } from '../../../shared/ui/HButton'
import type { MergeIdentity, MergeKind } from '../../../shared/merge/schema'
export function SelectedMerge({ kind, source, target, onClose, onMerged }: { kind: MergeKind; source: MergeIdentity; target: MergeIdentity; onClose: () => void; onMerged: (id: string) => Promise<void> }) {
  const contact = useQuery<Company | Person>({ queryKey: ['contacts', kind, target.id], queryFn: () => kind === 'companies' ? contactsService.company(target.id) : contactsService.person(target.id), enabled: kind !== 'products', retry: false })
  const product = useQuery({ queryKey: ['inventory', 'product', target.id], queryFn: () => catalogService.record(target.id), enabled: kind === 'products', retry: false })
  const error = kind === 'products' ? product.error : contact.error
  if (error) return <p role="alert" className="field-error">{error.message}<HButton onClick={onClose}>Fermer</HButton></p>
  if (kind === 'products') return product.data ? <ProductMergeDialog record={product.data} initialSource={source} onClose={onClose} onMerged={onMerged} /> : <p role="status">Chargement du produit à comparer…</p>
  return contact.data ? <ContactMergeDialog kind={kind} record={contact.data} initialSource={source} onClose={onClose} onMerged={onMerged} /> : <p role="status">Chargement de la fiche à comparer…</p>
}
