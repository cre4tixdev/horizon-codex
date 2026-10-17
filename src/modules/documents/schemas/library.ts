import { z } from 'zod'
import { activitySourceSchema } from '../../../core/activity/types/activity'
export const documentSpaces = { affairs: 'Affaires', customers: 'Clients', suppliers: 'Fournisseurs', internal: 'Interne' } as const
export const libraryThemes: Record<string, string> = { quotes: 'Devis', orders: 'Commandes clients', purchases: 'Commandes fournisseurs', requests: 'Demandes d’achat', deliveries: 'Bons de livraison', receipts: 'Bons de réception', stock: 'Opérations de stock', invoices: 'Factures clients', supplier_invoices: 'Factures fournisseurs', credits: 'Avoirs clients', supplier_credits: 'Avoirs fournisseurs', technical: 'Affaire', companies: 'Société', expenses: 'Notes de frais', leave: 'Congés', other: 'Autres pièces jointes' }
export const librarySpaces = documentSpaces
export const fileKinds: Record<string, string> = { pdf: 'PDF', image: 'Image', office: 'Bureautique', text: 'Texte / CSV' }
export const gedExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'txt', 'csv', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']
export const gedFormats = 'PDF, images, Word, Excel, PowerPoint, TXT et CSV'
export const libraryInputSchema = z.object({ name: z.string().max(255), space: z.enum(['affairs', 'customers', 'suppliers', 'internal']), folder: z.string(), category: z.string(), tags: z.array(z.string().trim().min(1).max(40)).max(10), description: z.string().max(4000), visibility: z.enum(['team', 'restricted']), readers: z.array(z.string()).max(100), links: z.array(z.object({ entity: z.string(), id: z.string() })).max(10) })
export type LibraryInput = z.infer<typeof libraryInputSchema>
export const versionSchema = z.object({ id: z.string(), number: z.number(), filename: z.string(), size: z.number(), note: z.string(), author: z.string(), created: z.string() })
export type LibraryVersion = z.infer<typeof versionSchema>
export const sourceLinkSchema = z.object({ entity: z.string(), id: z.string(), module: z.string(), label: z.string(), href: z.string(), analytic_account: z.string() })
export const libraryFileSchema = libraryInputSchema.omit({ links: true }).extend({ id: z.string(), folder_name: z.string(), category_name: z.string(), author: z.string(), created_by: z.string(), locked: z.boolean(), archived_at: z.string(), created: z.string(), updated: z.string(), current: versionSchema, links: z.array(sourceLinkSchema), theme: z.string().optional(), source_label: z.string().optional(), type_label: z.string().optional(), source_key: z.string().optional(), origin: z.object({ label: z.string(), warning: z.string().optional(), source: activitySourceSchema }).optional(), kind: z.string().optional(), group_key: z.string().optional(), group_label: z.string().optional(), reader_names: z.array(z.object({ value: z.string(), label: z.string() })).optional(), versions: z.array(versionSchema).optional() })
export type LibraryFile = z.infer<typeof libraryFileSchema>
export const folderSchema = z.object({ id: z.string(), name: z.string(), space: z.enum(['affairs', 'customers', 'suppliers', 'internal']), parent: z.string(), visibility: z.enum(['team', 'restricted']), readers: z.array(z.string()), active: z.boolean(), reader_names: z.array(z.object({ value: z.string(), label: z.string() })).optional(), created_by: z.string(), updated: z.string() })
export type LibraryFolder = z.infer<typeof folderSchema>
export const categorySchema = z.object({ id: z.string(), name: z.string(), active: z.boolean(), updated: z.string() })
export type LibraryCategory = z.infer<typeof categorySchema>
export const choicesSchema = z.object({ folders: z.array(folderSchema), categories: z.array(categorySchema) })
export type LibraryChoices = z.infer<typeof choicesSchema>
export const libraryPageSchema = z.object({ items: z.array(libraryFileSchema), totalItems: z.number(), totalPages: z.number(), page: z.number(), groups: z.record(z.string(), z.number()) })
export function previewable(name: string) { return /\.(pdf|png|jpe?g|webp)$/i.test(name) }
export function fileSize(size: number) { return size >= 1048576 ? `${(size / 1048576).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo` : `${Math.max(1, Math.round(size / 1024))} Ko` }

export function folderPath(folders: readonly LibraryFolder[], id: string): string { const names: string[] = []; for (let n = 0; id && n < 8; n++) { const current = folders.find((f) => f.id === id); if (!current) break; names.unshift(current.name); id = current.parent }; return names.join(' / ') }
