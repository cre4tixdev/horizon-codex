import { offerInputSchema, productInputSchema, type Product, type ProductInput } from '../schemas/catalog'

export function productDuplicate(source: Product, includeSuppliers: boolean): ProductInput {
  const input = productInputSchema.parse({ ...source, offers: source.offers.map((offer) => offerInputSchema.omit({ id: true }).parse({ ...offer, valid_from: offer.valid_from.slice(0, 10), valid_until: offer.valid_until.slice(0, 10) })) })
  return { ...input, name: `${source.name.slice(0, 192)} (copie)`, sku: '', barcode: '', reference_cost: source.pricing.unit_cost, offers: includeSuppliers ? input.offers : [] }
}
