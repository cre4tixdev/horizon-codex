import { z } from 'zod'
import { richTextSchema } from '../../../shared/schemas/richText'
export const contexts = { generic: 'Message libre', sales_quote: 'Devis', purchase_order: 'Commande fournisseur' }
export const contextSchema = z.enum(['generic', 'sales_quote', 'purchase_order'])
export type EmailContext = z.infer<typeof contextSchema>
export const mailStates = { draft: 'Brouillon', pending: 'En attente', processing: 'Envoi en cours', sent: 'Envoyé', failed: 'Échec', uncertain: 'À vérifier', cancelled: 'Annulé' }
export const connectionSchema = z.object({ status: z.enum(['connected', 'refreshing', 'reconnect', 'disconnected']), address: z.string(), connected_at: z.string(), can_receive: z.boolean().default(false), reception: z.object({ last_sync_at: z.string(), error: z.string() }).default({ last_sync_at: '', error: '' }) })
export const mailboxSchema = z.object({ id: z.string(), name: z.string(), address: z.email(), connection: connectionSchema, allowed_users: z.array(z.string()), receive_enabled: z.boolean().default(false), active: z.boolean(), updated: z.string() })
export const templateSchema = z.object({ id: z.string(), name: z.string(), context: contextSchema, language: z.enum(['fr', 'en']), subject: z.string(), body_json: richTextSchema, active: z.boolean(), is_default: z.boolean(), updated: z.string() })
export const signatureSchema = z.object({ id: z.string(), name: z.string(), user: z.string(), body_json: richTextSchema, active: z.boolean(), is_default: z.boolean(), updated: z.string() })
export const messageSchema = z.object({ id: z.string(), collectionId: z.string(), owner: z.string(), mailbox: z.string(), from_address: z.string(), to: z.array(z.string()), cc: z.array(z.string()), bcc: z.array(z.string()), subject: z.string(), body_json: richTextSchema, signature_snapshot: richTextSchema, html: z.string(), text: z.string(), status: z.enum(['draft', 'pending', 'processing', 'sent', 'failed', 'uncertain', 'cancelled']), source_context: contextSchema, source_id: z.string(), source_version: z.string(), source_label: z.string(), pdf_template: z.string(), attachments: z.array(z.string()), pdf_file: z.string(), error: z.string(), provider_request_id: z.string(), resolution_note: z.string(), resolved_at: z.string(), archived_at: z.string(), created: z.string(), updated: z.string(), queued_at: z.string(), sent_at: z.string() })
export const choicesSchema = z.object({ source_available: z.boolean(), source: z.object({ context: contextSchema, id: z.string(), version: z.string(), label: z.string(), to: z.array(z.string()) }), variables: z.array(z.string()), values: z.record(z.string(), z.string()), mailboxes: z.array(mailboxSchema), templates: z.array(templateSchema), signatures: z.array(signatureSchema), pdf_templates: z.array(z.object({ id: z.string(), name: z.string() })), configured: z.boolean(), can_send: z.boolean(), can_write: z.boolean(), can_settings: z.boolean() })
export const renderedSchema = z.object({ subject: z.string(), body_json: richTextSchema, signature_snapshot: richTextSchema })
export const settingsSchema = z.object({ configured: z.boolean(), variables: z.array(z.string()), users: z.array(z.object({ id: z.string(), name: z.string(), email: z.string() })), mailboxes: z.array(mailboxSchema), templates: z.array(templateSchema), signatures: z.array(signatureSchema) })
export const listSchema = z.object({ items: z.array(messageSchema), totalItems: z.number(), totalPages: z.number(), page: z.number() })
export type MailMessage = z.infer<typeof messageSchema>
export type MailChoices = z.infer<typeof choicesSchema>
export type MailSettings = z.infer<typeof settingsSchema>
export type MailTemplate = z.infer<typeof templateSchema>
export type MailSignature = z.infer<typeof signatureSchema>
export type Mailbox = z.infer<typeof mailboxSchema>
export type MailInput = Pick<MailMessage, 'mailbox' | 'subject' | 'to' | 'cc' | 'bcc' | 'body_json' | 'signature_snapshot' | 'source_version' | 'pdf_template'> & { context: EmailContext; source: string }
export type SettingInput = Omit<MailTemplate, 'id' | 'updated'> | Omit<MailSignature, 'id' | 'updated'> | Omit<Mailbox, 'id' | 'updated' | 'connection'>
export type SettingKind = 'templates' | 'mailboxes' | 'signatures'
export const mailTone = (s: MailMessage['status']) => ({ draft: 'violet', pending: 'amber', processing: 'amber', sent: 'green', failed: 'pink', uncertain: 'amber', cancelled: 'navy' } as const)[s]

export type PersonalSignatureInput = Omit<MailSignature, 'id' | 'updated' | 'user'>
