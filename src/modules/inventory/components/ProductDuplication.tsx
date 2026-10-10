import { useState } from 'react'
import { HRecordDuplication } from '../../../shared/ui/HRecordDuplication'

export function ProductDuplication({ name, onClose, onDuplicate }: { name: string; onClose: () => void; onDuplicate: (includeSuppliers: boolean) => void }) {
  const [includeSuppliers, setIncludeSuppliers] = useState(true)
  return <HRecordDuplication title="Dupliquer le produit" itemName={name} onClose={onClose} onDuplicate={() => onDuplicate(includeSuppliers)}>
    <label className="h-choice"><input type="checkbox" checked={includeSuppliers} onChange={(event) => setIncludeSuppliers(event.target.checked)} />Reprendre les fournisseurs et les prix d’achat</label>
    <p className="record-duplicate-note">Le fournisseur favori est conservé si les prix d’achat sont repris. L’historique d’achats et le stock restent propres à chaque produit.</p>
  </HRecordDuplication>
}
