import { HTag } from './HTag'
export type AffairTag = { code: string; title?: string | undefined; label?: string | undefined; client?: string | undefined; quantity?: number | undefined; unit?: string | undefined }
export function HAffairTags({ items, quantities = false }: { items: AffairTag[]; quantities?: boolean }) {
  const unique = new Map(items.filter((item) => item.code).map((item) => [`${item.code}:${quantities ? `${item.quantity}:${item.unit}` : ''}`, item]))
  return <span className="h-affair-tags">{[...unique.values()].map((item, index) => {
    const identity = `${item.code}${item.client || item.label ? ` - ${item.client || item.label}` : ''}`
    return <HTag key={`${item.code}-${index}`} tone="navy" title={item.title || identity}>{identity}{quantities && item.quantity !== undefined && <span> [ {item.quantity.toLocaleString('fr-FR', { maximumFractionDigits: 6 })}{item.unit || ''} ]</span>}</HTag>
  })}</span>
}
