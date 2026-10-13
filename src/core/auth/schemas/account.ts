import { z } from 'zod'
export const presenceSchema = z.enum(['available', 'away', 'busy', 'offline'])
export type Presence = z.infer<typeof presenceSchema>
export const presenceLabels = { available: 'Présent', away: 'Absent', busy: 'Occupé', offline: 'Hors ligne' } as const
export const accountInputSchema = z.object({
  presence: presenceSchema.default('available'),
  first_name: z.string().trim().min(1, 'Renseignez votre prénom.').max(80),
  last_name: z.string().trim().min(1, 'Renseignez votre nom.').max(80),
  name: z.string().trim().min(1, 'Renseignez votre nom affiché.').max(160),
  public_email: z.union([z.literal(''), z.email('Adresse e-mail invalide.')]),
}).strict()
export const accountSchema = accountInputSchema.extend({ first_name: z.string(), last_name: z.string(), id: z.string(), collectionId: z.string(), updated: z.string(), email: z.email(), avatar: z.string(), employee_id: z.string(), role_label: z.string(), erp_profile: z.string() })
export const passwordInputSchema = z.object({ current_password: z.string().min(1, 'Saisissez votre mot de passe actuel.').max(1024), password: z.string().min(12, 'Au moins 12 caractères.').max(1024), password_confirm: z.string() }).strict().refine((value) => value.password === value.password_confirm, { message: 'La confirmation ne correspond pas.', path: ['password_confirm'] })
export type AccountInput = z.infer<typeof accountInputSchema>
export type Account = z.infer<typeof accountSchema>
export type PasswordInput = z.infer<typeof passwordInputSchema>
