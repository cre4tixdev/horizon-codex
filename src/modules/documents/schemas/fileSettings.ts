import { z } from 'zod'
export const documentFileTypes = { quote: 'Devis', sales_order: 'Commande client', purchase_order: 'Commande fournisseur', delivery_note: 'Bon de livraison' } as const
export const fileSettingsSchema = z.object({ updated: z.string(), patterns: z.object({ quote: z.string(), sales_order: z.string(), purchase_order: z.string(), delivery_note: z.string() }) })
export type FileSettings = z.infer<typeof fileSettingsSchema>

export const filenameFields = {
  number: { label: 'Pièce · Numéro', example: '00001-1' },
  date: { label: 'Pièce · Date', example: '2026-10-09' },
  title: { label: 'Pièce · Titre', example: 'Installation vidéo' },
  client: { label: 'Client · Nom', example: 'CVS' },
  company: { label: 'Client · Société (alias)', example: 'CVS' },
  opportunity_number: { label: 'Opportunité · Numéro', example: '00001' },
  opportunity: { label: 'Opportunité · Titre', example: 'Studio broadcast' },
  owner: { label: 'Responsable · Nom', example: 'Guillaume Clairardin' },
  contact: { label: 'Interlocuteur · Nom', example: 'Jean Dupont' },
} as const
export function filenameExample(pattern: string, type: keyof typeof documentFileTypes) {
  const values = Object.fromEntries(Object.entries(filenameFields).map(([key, field]) => [key, key === 'number' && type !== 'quote' ? '00001' : field.example]))
  return pattern.replace(/\.pdf$/i, '').replace(/\{([^{}]+)\}/g, (match, token: string) => values[token] ?? match) + '.pdf'
}
