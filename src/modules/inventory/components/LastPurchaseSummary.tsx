import { CalendarDays, Receipt, Truck } from 'lucide-react'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { formatUnitAmount } from '../../../shared/formatters/money'

export function LastPurchaseSummary({ price, date, currency, unit, supplier, description }: { price: number | null; date: string; currency: string; unit: string; supplier: string; description: string }) {
  return <section className="catalog-last-purchase" aria-label="Dernier prix d’achat">
    <HSectionHeading title="Dernier prix d’achat" icon={Receipt} description={description} />
    <div className="catalog-last-purchase-values">
      <div><span>Prix unitaire HT</span><strong>{price === null ? '—' : formatUnitAmount(price, currency)}{price !== null && <small> / {unit}</small>}</strong></div>
      <div><span><CalendarDays size={13} aria-hidden="true" />Date</span><strong>{date ? new Date(date).toLocaleDateString('fr-FR') : '—'}</strong></div>
      <div><span><Truck size={13} aria-hidden="true" />Fournisseur</span><strong>{supplier || '—'}</strong></div>
    </div>
  </section>
}
