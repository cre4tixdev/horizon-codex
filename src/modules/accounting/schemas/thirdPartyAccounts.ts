import { z } from 'zod'
export const accountCodeSchema = z.string().trim().max(32).regex(/^$|^[A-Za-z0-9][A-Za-z0-9._-]*$/, 'Utilisez un numéro de compte sans espaces.')
export const thirdPartyAccountSchema = z.object({ id: z.string(), company: z.string(), type: z.enum(['customer', 'supplier']), account_code: accountCodeSchema, active: z.boolean() })
export const accountDraftSchema = z.object({ customer_account: accountCodeSchema, supplier_account: accountCodeSchema })
export type AccountDraft = z.infer<typeof accountDraftSchema>
