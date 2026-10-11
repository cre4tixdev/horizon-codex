import { Link } from 'react-router'
import { Package, PackageCheck } from 'lucide-react'
import { formatAmount } from '../../../shared/formatters/money'
import { HTag } from '../../../shared/ui/HTag'
import type { Product } from '../schemas/catalog'

const quantities = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 6 })

export function ProductCards({ items, listQuery }: { items: Product[]; listQuery: string }) {
  return <div className="catalog-card-grid" aria-label="Produits en cartes">{items.map((product) => <Link key={product.id} className="catalog-card" to={`/inventory/products/${product.id}`} state={{ productListQuery: listQuery }} aria-label={`Ouvrir ${product.name}`}>
    <div className="catalog-card-photo">{product.image_url ? <img src={product.image_url} alt="" loading="lazy" /> : <Package size={30} aria-hidden="true" />}</div>
    <div className="catalog-card-content">
      <strong className="catalog-card-name" title={product.name}>{product.name}</strong>
      <div className="catalog-card-meta"><span className="catalog-card-brand" title={product.manufacturer}>{product.manufacturer || 'Marque à compléter'}</span><span className="catalog-card-reference" title={product.sku}>{product.sku}</span>{!product.active && <HTag tone="navy">Archivé</HTag>}</div>
      <span className="catalog-card-family" title={product.category_label}>{product.category_label}</span>
      <div className="catalog-card-bottom">
        <div className="catalog-card-price">{product.pricing.unit_price === null ? <span title={product.pricing.warning}>Prix à vérifier</span> : <><strong>{formatAmount(product.pricing.unit_price, product.sale_currency)}</strong><small>HT / {product.unit_code}</small></>}</div>
        <span className={`catalog-card-stock${product.available_quantity !== null && product.available_quantity > 0 ? ' catalog-card-stock--available' : ''}`} title="Stock disponible après réservations, tous emplacements actifs" aria-label={product.available_quantity === null ? 'Sans stock' : `Disponible : ${quantities.format(product.available_quantity)} ${product.unit_code}`}><PackageCheck size={13} aria-hidden="true" />{product.available_quantity === null ? 'Sans stock' : <>{quantities.format(product.available_quantity)} {product.unit_code}</>}</span>
      </div>
    </div>
  </Link>)}</div>
}
