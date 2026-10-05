import { FileText, Receipt, Truck, Target } from 'lucide-react'
// These modules have no executable collections/routes yet. Never invent totals.
export function CompanyBusinessLinks({ person = false, companyName }: { person?: boolean; companyName?: string }) {
  return <nav className="company-business-links" aria-label={person ? 'Objets métier de la société associée' : 'Objets métier de la société'}>{person && <span className="company-business-context">Activité de {companyName}</span>}{[{ label: 'Devis', icon: FileText }, { label: 'Factures', icon: Receipt }, { label: 'Bons de livraison', icon: Truck }, { label: 'Opportunités', icon: Target }].map(({ label, icon: Icon }) => <button key={label} type="button" disabled title="Disponible à la livraison du module concerné · périmètre société"><Icon size={17} /><span>{label}</span><small>À venir</small></button>)}</nav>
}
