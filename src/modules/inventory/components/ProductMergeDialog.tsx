import { Package } from 'lucide-react'
import { MergeDialog } from '../../../shared/merge/MergeDialog'
import { ProtectedRecordImage } from '../../../shared/images/ProtectedRecordImage'
import type { MergeAdapter, MergeIdentity } from '../../../shared/merge/schema'
import { catalogService } from '../services/CatalogService'
import type { Product } from '../schemas/catalog'
const labels: Record<string, string> = { sku: 'Référence conservée', barcode: 'Code-barres · alias préservé', primary_image: 'Photo', name: 'Désignation', description: 'Description', category: 'Famille', manufacturer_ref: 'Référence fabricant', weight_kg: 'Poids (kg)', volume_m3: 'Volume (m³)', hs_code: 'Code SH', origin_country: 'Pays d’origine', brand: 'Marque', kind: 'Type', base_unit: 'Unité de base', sale_unit: 'Unité de vente', stock_policy: 'Politique de stock', replenishment_policy: 'Approvisionnement', tracking: 'Suivi', composition_mode: 'Composition', sale_currency: 'Devise', variant_group: 'Variante', reference_cost: 'Coût de référence conservé' }
export function ProductMergeDialog({ record, initialSource, onClose, onMerged }: { record: Product; initialSource?: MergeIdentity | undefined; onClose: () => void; onMerged: (id: string) => Promise<void> }) {
  const adapter: MergeAdapter = {
    key: 'products', title: 'Fusionner les produits', labels, countLabels: { offers: 'offre(s) fournisseur', histories: 'prix historiques', references: 'référence(s) d’import' },
    description: 'Les anciennes références restent des alias recherchables. Les offres et leur historique sont conservés ; l’offre préférée de la cible reste prioritaire. Aucun stock ni document historique n’est déplacé. L’ancienne fiche et ses fichiers restent consultables.',
    search: catalogService.mergeChoices,
    preview: catalogService.mergePreview, apply: catalogService.mergeApply,
  }
  return <MergeDialog kind="products" record={{ id: record.id, collectionId: record.collectionId, label: `${record.sku} · ${record.name}` }} initialSource={initialSource} adapter={adapter} onClose={onClose} onMerged={onMerged} renderImage={(identity, filename) => <span className="contact-avatar contact-avatar--company">{filename ? <ProtectedRecordImage collectionId={identity.collectionId} id={identity.id} filename={filename} loadURL={catalogService.imageURL} className="contact-logo-image" /> : <Package size={16} />}</span>} />
}
