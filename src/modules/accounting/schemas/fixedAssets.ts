import { z } from 'zod'
export const fixedAssetStates = { draft: 'À qualifier', registered: 'Enregistrée', disposed: 'Déclassée' }
export const fixedAssetInputSchema = z.object({ acquisition_cost: z.number().nonnegative().max(1000000000), in_service_date: z.string(), accounting_reference: z.string().max(160), notes: z.string().max(10000) })
export const fixedAssetSchema = fixedAssetInputSchema.extend({ id: z.string(), updated: z.string(), internal_asset: z.string(), currency: z.string(), acquisition_date: z.string(), status: z.enum(['draft', 'registered', 'disposed']), number: z.string(), name: z.string(), product_name: z.string(), reference: z.string(), serial_number: z.string(), asset_status: z.string(), registered_at: z.string() })
export const fixedAssetsPageSchema = z.object({ items: z.array(fixedAssetSchema), page: z.number(), totalItems: z.number(), totalPages: z.number() })
export type FixedAsset = z.infer<typeof fixedAssetSchema>
export type FixedAssetInput = z.infer<typeof fixedAssetInputSchema>
