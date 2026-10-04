import { z } from 'zod'

const text = (max: number) => z.string().trim().max(max)
const email = z.union([z.literal(''), z.email('Adresse e-mail invalide.')])
const base = z.object({ id: z.string(), collectionId: z.string(), created: z.string(), updated: z.string() })
export const roleValues = ['customer', 'prospect', 'supplier', 'partner', 'other'] as const
export const roleLabels = { customer: 'Client', prospect: 'Prospect', supplier: 'Fournisseur', partner: 'Partenaire', other: 'Autre' }
export const addressValues = ['registered', 'billing', 'shipping', 'other'] as const
export const addressLabels = { registered: 'Siège', billing: 'Facturation', shipping: 'Livraison', other: 'Autre' }
export const companyInputSchema = z.object({
  name: text(160).min(1, 'Saisissez un nom.'), legal_name: text(200), vat_number: text(80), fiscal_identifier: text(80),
  preferred_language: text(12), preferred_currency: z.string().regex(/^$|^[A-Z]{3}$/, 'Utilisez un code sur trois lettres (EUR…).'), default_currency: z.string().regex(/^$|^[A-Z]{3}$/, 'Utilisez un code sur trois lettres (EUR…).'),
  website: z.union([z.literal(''), z.url({ protocol: /^https?$/, error: 'Utilisez une adresse HTTP ou HTTPS.' })]),
  phone: text(40), email, notes: text(10000),
})
export const personInputSchema = z.object({ company: z.string(), first_name: text(80), last_name: text(80), job_title: text(120), email, phone: text(40), mobile: text(40), notes: text(10000) })
  .refine((value) => Boolean(value.first_name || value.last_name), { path: ['last_name'], message: 'Saisissez au moins un prénom ou un nom.' })
export const addressInputSchema = z.object({ company: z.string().min(1), type: z.enum(addressValues), line1: text(200).min(1, 'Saisissez une adresse.'), line2: text(200), postal_code: text(20), city: text(100).min(1, 'Saisissez une ville.'), country: z.string().regex(/^[A-Z]{2}$/, 'Code pays sur deux lettres (FR…).'), state_region: text(100) })
export const roleSchema = base.extend({ company: z.string(), role: z.enum(roleValues), active: z.boolean() })
export const companySchema = base.extend(companyInputSchema.shape).extend({ active: z.boolean(), logo: z.string(), images: z.array(z.string()), expand: z.object({ contacts_company_roles_via_company: z.array(roleSchema).optional() }).optional() })
export const personSchema = base.extend(personInputSchema.shape).extend({ active: z.boolean(), avatar: z.string(), expand: z.object({ company: companySchema.optional() }).optional() })
export const addressSchema = base.extend(addressInputSchema.shape)
