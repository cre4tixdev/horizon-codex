import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().pipe(z.email('Saisissez une adresse e-mail valide.')),
  password: z.string().min(1, 'Saisissez votre mot de passe.').max(1024, 'Mot de passe trop long.'),
})
export type LoginInput = z.infer<typeof loginSchema>

export const userSchema = z.object({
  id: z.string().min(1), collectionName: z.literal('core_users'),
  email: z.email(), name: z.string().min(1), active: z.literal(true),
  role: z.string().min(1),
  expand: z.object({ role: z.object({
    id: z.string().min(1), name: z.string().min(1), label: z.string().min(1),
    active: z.literal(true), permissions: z.array(z.string().min(1)),
  }) }),
}).refine((user) => user.role === user.expand.role.id, 'Rôle incohérent.')
