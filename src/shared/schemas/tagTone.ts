import { z } from 'zod'
export const tagTones = ['blue', 'violet', 'pink', 'green', 'amber', 'navy'] as const
export const tagToneSchema = z.enum(tagTones)
export type TagTone = z.infer<typeof tagToneSchema>
export const tagToneLabels: Record<TagTone, string> = { blue: 'Bleu', violet: 'Violet', pink: 'Rose', green: 'Vert', amber: 'Orange', navy: 'Navy' }
// Additional swatches use the existing hexadecimal override, without new semantic tones.
export const extraTagColors = [
  { label: 'Bleu ciel', color: '#0284C7' }, { label: 'Bleu pétrole', color: '#0E7490' },
  { label: 'Turquoise', color: '#0D9488' }, { label: 'Menthe', color: '#059669' },
  { label: 'Vert lime', color: '#65A30D' }, { label: 'Olive', color: '#6B7B22' },
  { label: 'Jaune', color: '#A16207' }, { label: 'Ambre', color: '#B7791F' },
  { label: 'Corail', color: '#E06446' }, { label: 'Rouge', color: '#DC2626' },
  { label: 'Bordeaux', color: '#9F1239' }, { label: 'Framboise', color: '#BE185D' },
  { label: 'Magenta', color: '#C026D3' }, { label: 'Mauve', color: '#9333EA' },
  { label: 'Indigo', color: '#4F46E5' }, { label: 'Lavande', color: '#8B5CF6' },
  { label: 'Ardoise', color: '#475569' }, { label: 'Gris', color: '#71717A' },
] as const
