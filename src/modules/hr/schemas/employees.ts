import { z } from 'zod'
export const employeeStatuses = ['active', 'planned', 'inactive', 'ended'] as const
export const statusLabels = { active: 'Actif', planned: 'À venir', inactive: 'Inactif', ended: 'Terminé' }
export const employmentTypes = ['employee', 'freelance', 'interim', 'external'] as const
export const typeLabels = { employee: 'Salarié', freelance: 'Freelance', interim: 'Intérimaire', external: 'Externe' }
export const employeeInputSchema = z.object({ first_name: z.string().trim().min(1).max(80), last_name: z.string().trim().min(1).max(80), professional_email: z.email().or(z.literal('')), professional_phone: z.string().max(40), job_title: z.string().max(120), employment_type: z.enum(employmentTypes), team: z.string(), manager: z.string(), is_manager: z.boolean(), is_direction: z.boolean(), external_company: z.string(), start_date: z.string(), end_date: z.string(), status: z.enum(employeeStatuses) })
export const employeeSchema = employeeInputSchema.extend({ id: z.string(), collectionId: z.string(), avatar: z.string(), updated: z.string(), account_id: z.string(), has_account: z.boolean(), account_active: z.boolean() })
export const teamSchema = z.object({ id: z.string(), managers: z.array(z.string()), name: z.string(), active: z.boolean(), updated: z.string() })
export type Team = z.infer<typeof teamSchema>
export const hrDirectorySchema = z.object({ employees: z.array(employeeSchema), teams: z.array(teamSchema), can_manage_teams: z.boolean() })
export type Employee = z.infer<typeof employeeSchema>
export type EmployeeInput = z.infer<typeof employeeInputSchema>
export const employeeName = (employee: Pick<Employee, 'first_name' | 'last_name'>) => `${employee.first_name} ${employee.last_name}`.trim()
export const emptyEmployee: EmployeeInput = { first_name: '', last_name: '', professional_email: '', professional_phone: '', job_title: '', employment_type: 'employee', team: '', manager: '', is_manager: false, is_direction: false, external_company: '', start_date: '', end_date: '', status: 'active' }
