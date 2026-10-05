import { z } from 'zod'

const text = (max: number) => z.string().trim().max(max)
const email = z.union([z.literal(''), z.email('Adresse e-mail invalide.')])
const base = z.object({ id: z.string(), collectionId: z.string(), created: z.string(), updated: z.string() })
export const roleValues = ['customer', 'supplier'] as const
export const roleLabels = { customer: 'Client', supplier: 'Fournisseur' }
export const addressValues = ['registered', 'billing', 'shipping', 'other'] as const
export const addressLabels = { registered: 'Siège', billing: 'Facturation', shipping: 'Livraison', other: 'Autre' }
export const companyInputSchema = z.object({
  name: text(160).min(1, 'Saisissez un nom.'), legal_name: text(200), vat_number: text(80), lei: z.string().trim().toUpperCase().regex(/^$|^[A-Z0-9]{20}$/, 'Le LEI comporte 20 caractères alphanumériques.').default(''),
  preferred_language: text(35), default_currency: z.string().regex(/^$|^[A-Z]{3}$/, 'Utilisez un code sur trois lettres (EUR…).'),
  siren: z.string().trim().transform((value) => value.replace(/\s/g, '')).pipe(z.string().regex(/^$|^\d{9}$/, 'Le SIREN comporte 9 chiffres.')).default(''),
  siret: z.string().trim().transform((value) => value.replace(/\s/g, '')).pipe(z.string().regex(/^$|^\d{14}$/, 'Le SIRET comporte 14 chiffres.')).default(''),
  website: z.union([z.literal(''), z.url({ protocol: /^https?$/, error: 'Utilisez une adresse HTTP ou HTTPS.' })]),
  phone: text(40), email, notes: text(10000),
  billing_email: email.default(''), einvoice_routing_address: text(120).default(''), einvoice_platform: text(120).default(''), einvoice_service_code: text(100).default(''),
  einvoice_status: z.union([z.enum(['unknown', 'to_configure', 'ready', 'not_applicable']), z.literal('')]).transform((value) => value || 'unknown').default('unknown'),
})
export const personInputSchema = z.object({ company: z.string(), first_name: text(80), last_name: text(80), job_title: text(120), email, phone: text(40), mobile: text(40), notes: text(10000) })
  .refine((value) => Boolean(value.first_name || value.last_name), { path: ['last_name'], message: 'Saisissez au moins un prénom ou un nom.' })
export const addressInputSchema = z.object({ company: z.string().min(1), type: z.enum(addressValues), line1: text(200).min(1, 'Saisissez une adresse.'), line2: text(200), postal_code: text(20), city: text(100).min(1, 'Saisissez une ville.'), country: z.string().regex(/^[A-Z]{2}$/, 'Code pays sur deux lettres (FR…).'), state_region: text(100), is_primary: z.boolean().default(false) })
export const roleSchema = base.extend({ company: z.string(), role: z.enum(roleValues), active: z.boolean() })
export const addressSchema = base.extend(addressInputSchema.shape)
export const companySchema = base.extend(companyInputSchema.shape).extend({ active: z.boolean(), logo: z.string(), images: z.array(z.string()), expand: z.object({ contacts_company_roles_via_company: z.array(roleSchema).optional(), contacts_addresses_via_company: z.array(addressSchema).optional() }).optional() })
export const personSchema = base.extend(personInputSchema.shape).extend({ active: z.boolean(), avatar: z.string(), expand: z.object({ company: companySchema.optional() }).optional() })
