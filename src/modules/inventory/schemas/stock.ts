import { z } from 'zod'
export const stockSelectionSchema = z.object({ source_line: z.string(), location: z.string(), quantity: z.number().positive() })
export type StockSelection = z.infer<typeof stockSelectionSchema>
export const balanceSchema = z.object({ physical: z.number(), reserved: z.number(), available: z.number() })
export const stockRowSchema = balanceSchema.extend({ valuation: z.number().nullable().optional(), valuation_method: z.string().optional(), valuation_currency: z.string().optional(), incoming: z.number().nullable(), id: z.string(), product: z.string(), name: z.string(), reference: z.string(), brand: z.string(), unit: z.string(), location: z.string(), location_name: z.string() })
export const stockPageSchema = z.object({ items: z.array(stockRowSchema), page: z.number(), totalItems: z.number(), totalPages: z.number(), summary: z.object({ all: z.number().int().nonnegative(), physical: z.number().int().nonnegative(), reserved: z.number().int().nonnegative(), available: z.number().int().nonnegative() }) })
export const stockChoicesSchema = z.object({ products: z.array(z.object({ id: z.string(), name: z.string() })), locations: z.array(z.object({ id: z.string(), name: z.string() })), warehouses: z.array(z.object({ id: z.string(), name: z.string() })) })
export const reservationChoicesSchema = z.object({ revision: z.string(), lines: z.array(z.object({ source_line: z.string(), description: z.string(), quantity: z.number(), capacity: z.number(), unit: z.string(), reservable: z.boolean(), selected: z.array(z.object({ location: z.string(), quantity: z.number() })), locations: z.array(balanceSchema.extend({ id: z.string(), name: z.string() })) })) })
export type StockRow = z.infer<typeof stockRowSchema>
export type ReservationChoices = z.infer<typeof reservationChoicesSchema>
export type StockQuery = { availability?: string; q: string; product: string; location: string; page: number; sort: string; group: string }
export type StockAdjustment = { product: string; location: string; physical: number; expected: number; reason: string; operation_key: string }
