import { z } from 'zod'
export const importTypeSchema = z.enum(['companies', 'people'])
export const importModeSchema = z.enum(['create', 'update', 'upsert'])
const values = z.record(z.string(), z.union([z.string(), z.boolean()]))
export const importRowSchema = z.object({ id: z.string(), number: z.number(), status: z.string(), action: z.string(), data: values, before: values, match: z.string(), target: z.string(), error: z.string(), resolution: z.string(), candidates: z.array(z.object({ id: z.string(), label: z.string() })) })
export const summarySchema = z.object({ total: z.number(), create: z.number(), update: z.number(), skip: z.number(), conflict: z.number(), error: z.number(), applied: z.number() })
export const jobSchema = z.object({ id: z.string(), type: importTypeSchema, source: z.enum(['file', 'odoo']), filename: z.string(), status: z.string(), mode: importModeSchema, mapped_fields: z.array(z.string()).optional(), created: z.string(), summary: summarySchema, error: z.string(), rows: z.array(importRowSchema) })
export const jobMutationSchema = jobSchema.extend({ partial: z.literal(true).optional() })
export const historySchema = z.object({ items: z.array(jobSchema.omit({ mode: true, mapped_fields: true, source: true, rows: true, error: true })) })
export const profilesSchema = z.object({ items: z.array(z.object({ id: z.string(), name: z.string(), type: importTypeSchema, headers: z.array(z.string()), mapping: z.record(z.string(), z.number().int().nonnegative()), mode: importModeSchema })) })
export const odooConfigSchema = z.object({ configured: z.boolean(), can_configure: z.boolean(), base_url: z.string(), database: z.string() })
export const sourceSchema = z.object({ headers: z.array(z.string()), rows: z.array(z.array(z.string())), namespace: z.string(), has_more: z.boolean(), after_id: z.number().int().nonnegative(), total: z.number().int().nonnegative(), image_fields: z.array(z.string()).optional() })
export type ImportType = z.infer<typeof importTypeSchema>
export type ImportMode = z.infer<typeof importModeSchema>
export type ImportJobMutation = z.infer<typeof jobMutationSchema>
export type ImportJob = z.infer<typeof jobSchema>
export type ImportRow = z.infer<typeof importRowSchema>
export type SourceData = { headers: string[]; rows: string[][]; namespace: string; filename: string; imageInfo?: { received: number; valid: number; fields: string[] | undefined } }
export type PreviewInput = SourceData & { type: ImportType; mode: ImportMode; source: 'file' | 'odoo'; key: string; mapping: Record<string, number> }
export const actionLabels: Record<string, string> = { create: 'À créer', update: 'À modifier', skip: 'Ignorée', conflict: 'À résoudre', error: 'Erreur', applied: 'Traitée' }
export const modeOptions = [{ value: 'upsert', label: 'Créer et mettre à jour' }, { value: 'create', label: 'Créer uniquement' }, { value: 'update', label: 'Mettre à jour uniquement' }]
const common = [{ key: 'image_base64', label: 'Image (base64)', aliases: ['image', 'image base64', 'image 256', 'image 128', 'image 512', 'image 1920', 'logo', 'avatar', 'photo'] }, { key: 'external_id', label: 'Identifiant externe', aliases: ['id', 'identifiant', 'external id', 'xml id'] }, { key: 'email', label: 'E-mail', aliases: ['email', 'e-mail', 'courriel'] }, { key: 'phone', label: 'Téléphone', aliases: ['phone', 'telephone', 'tel'] }, { key: 'notes', label: 'Notes', aliases: ['notes', 'commentaire'] }]
export const targetFields = {
  companies: [{ key: 'name', label: 'Nom de la société', aliases: ['name', 'nom', 'societe', 'entreprise', 'nom societe'] }, { key: 'legal_name', label: 'Raison sociale', aliases: ['legal name', 'raison sociale'] }, { key: 'siren', label: 'SIREN', aliases: ['siren'] }, { key: 'siret', label: 'SIRET', aliases: ['siret'] }, { key: 'vat_number', label: 'N° TVA', aliases: ['vat', 'vat number', 'tva', 'numero tva'] }, ...common, { key: 'website', label: 'Site web', aliases: ['website', 'site', 'site web'] }, { key: 'customer', label: 'Client (oui/non)', aliases: ['customer', 'client'] }, { key: 'supplier', label: 'Fournisseur (oui/non)', aliases: ['supplier', 'fournisseur'] }, { key: 'line1', label: 'Adresse', aliases: ['line1', 'street', 'adresse', 'rue'] }, { key: 'line2', label: 'Complément d’adresse', aliases: ['line2', 'street2', 'complement'] }, { key: 'postal_code', label: 'Code postal', aliases: ['postal code', 'zip', 'code postal', 'cp'] }, { key: 'city', label: 'Ville', aliases: ['city', 'ville'] }, { key: 'country', label: 'Pays (code FR…)', aliases: ['country', 'pays', 'code pays'] }],
  people: [{ key: 'first_name', label: 'Prénom', aliases: ['first name', 'prenom'] }, { key: 'last_name', label: 'Nom / nom complet', aliases: ['last name', 'nom', 'name', 'nom complet'] }, ...common, { key: 'mobile', label: 'Mobile', aliases: ['mobile', 'portable'] }, { key: 'job_title', label: 'Fonction', aliases: ['job title', 'fonction', 'poste'] }, { key: 'company_external_id', label: 'Société : identifiant externe', aliases: ['company external id', 'parent id', 'id societe'] }, { key: 'company_siren', label: 'Société : SIREN', aliases: ['company siren', 'siren societe'] }, { key: 'company_name', label: 'Société : nom exact', aliases: ['company name', 'societe', 'entreprise'] }],
} satisfies Record<ImportType, { key: string; label: string; aliases: string[] }[]>
export const normalizeHeader = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[_\-./]+/g, ' ').replace(/\s+/g, ' ').trim()
export function suggestMapping(type: ImportType, headers: string[]) {
  return Object.fromEntries(targetFields[type].flatMap((field) => { const index = headers.findIndex((h) => [field.key, ...field.aliases].some((alias) => normalizeHeader(alias) === normalizeHeader(h))); return index < 0 ? [] : [[field.key, index]] }))
}

export const modeDescriptions: Record<ImportMode, string> = {
  upsert: 'Crée les nouvelles fiches et met à jour les fiches reconnues avec les champs renseignés.',
  create: 'Crée les nouvelles fiches. Les fiches déjà reconnues restent inchangées.',
  update: 'Met à jour les fiches reconnues. Les fiches absentes d’Horizon sont ignorées.',
}
