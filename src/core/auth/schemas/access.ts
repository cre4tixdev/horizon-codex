import { z } from 'zod'
export const erpProfiles = ['admin', 'superuser', 'user', 'viewer'] as const
export const profileLabels = { admin: 'Admin', superuser: 'Superuser', user: 'User', viewer: 'Viewer' }
export const scopeLabels = { all: 'Tout le module', self: 'Soi-même', reports: 'Collaborateurs directs', team: 'Son équipe' }
export const grantSchema = z.object({ actions: z.array(z.string()), scope: z.enum(['all', 'self', 'reports', 'team']) })
export const grantsSchema = z.record(z.string(), grantSchema)
export const accessUserSchema = z.object({ id: z.string(), name: z.string(), email: z.string(), active: z.boolean(), erp_profile: z.enum(erpProfiles), employee: z.string(), updated: z.string(), grants: grantsSchema, employee_identity: z.object({ id: z.string(), name: z.string(), is_manager: z.boolean(), is_direction: z.boolean() }).nullable() })
export const moduleAccessSchema = z.object({ key: z.string(), label: z.string(), available: z.boolean(), actions: z.array(z.string()), scopes: z.array(z.enum(['all', 'self', 'reports', 'team'])) })
export const accessDirectorySchema = z.object({ users: z.array(accessUserSchema), modules: z.array(moduleAccessSchema), employees: z.array(z.object({ id: z.string(), name: z.string(), status: z.string() })) })
export const accessInputSchema = accessUserSchema.pick({ name: true, email: true, active: true, erp_profile: true, employee: true, grants: true }).extend({ name: z.string().trim().min(1).max(160), email: z.email(), password: z.string().max(1024).refine((value) => !value || value.length >= 12, 'Au moins 12 caractères.') })
export type AccessUser = z.infer<typeof accessUserSchema>
export type AccessInput = z.infer<typeof accessInputSchema>
export type AccessDirectory = z.infer<typeof accessDirectorySchema>
