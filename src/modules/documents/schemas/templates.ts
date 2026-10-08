import { z } from 'zod'
import { richTextSchema, plainTextDocument, type RichTextNode } from '../../../shared/schemas/richText'
export const bindingLabels = {
  'quote.quote_number': 'Numéro du devis', 'quote.title': 'Titre du devis', 'quote.quote_date': 'Date du devis', 'quote.valid_until': 'Date de validité', 'quote.validity_days': 'Durée de validité (jours)', 'quote.currency': 'Devise', 'quote.subtotal_before_discount': 'HT avant remise', 'quote.discount_amount': 'Remise globale', 'quote.subtotal': 'Total HT', 'quote.tax_rate': 'Taux de TVA', 'quote.tax': 'Montant TVA', 'quote.total': 'Total TTC', 'quote.options_total': 'Total options', 'quote.terms_label': 'Nom des conditions de vente', 'quote.terms_content': 'Conditions de vente', 'company.name': 'Société cliente', 'company.vat_number': 'TVA du client', 'company.legal_name': 'Raison sociale', 'company.email': 'E-mail', 'company.phone': 'Téléphone', 'company.siret': 'SIRET', 'company.address': 'Adresse complète', 'company.line1': 'Adresse — ligne 1', 'company.line2': 'Adresse — ligne 2', 'company.postal_code': 'Code postal', 'company.city': 'Ville', 'company.country': 'Pays (code)', 'company.country_name': 'Pays', 'company.state_region': 'Région', 'opportunity.title': 'Affaire', 'opportunity.number': 'Code opportunité', 'owner.name': 'Responsable', 'contact.name': 'Interlocuteur', 'contact.email': 'E-mail', 'contact.phone': 'Téléphone',
} as const
export const columnLabels = { description: 'Description', brand: 'Marque', reference: 'Référence', quantity: 'Qté', unit: 'u.', unit_price: 'PU HT', discount: 'Remise %', line_total: 'Total HT' } as const
export const fonts = ['Inter', 'Montserrat', 'Arial', 'Roboto', 'Open Sans', 'Lato', 'Source Sans 3', 'Noto Serif'] as const
export const anchorSchema = z.object({ anchorX: z.enum(['left', 'center', 'right']).optional(), anchorY: z.enum(['top', 'bottom']).optional() })
export const bindingGroups = { quote: 'Ventes · Devis', company: 'Contacts · Société / adresse', opportunity: 'CRM · Opportunité', owner: 'Utilisateurs · Responsable', contact: 'Contacts · Interlocuteur' } as const
const color = z.string().regex(/^#[a-f0-9]{6}$/i)
export const styleSchema = z.strictObject({ font: z.enum(fonts), size: z.number().min(8).max(48), color, background: color, backgroundOpacity: z.number().min(0).max(1).optional(), align: z.enum(['left', 'center', 'right']), bold: z.boolean(), italic: z.boolean(), uppercase: z.boolean(), border: z.boolean() })
export const blockSchema = z.strictObject({ id: z.string().min(1).max(100), sameLine: z.boolean().optional(), ...anchorSchema.shape, imageRatio: z.number().min(0.0001).max(10000).optional(), lockAspect: z.boolean().optional(), tableSource: z.literal('sales.quote_lines').optional(), tableHeadings: z.array(styleSchema).length(3).optional(), kind: z.enum(['text', 'field', 'image', 'table', 'totals', 'terms', 'separator', 'spacer', 'pageBreak', 'pageNumber']), zone: z.enum(['header', 'body', 'footer']), x: z.number().min(0), y: z.number().min(0).max(200), width: z.number().min(20), height: z.number().min(0).max(400), style: styleSchema, text: z.string().max(10000), content: richTextSchema.nullable(), field: z.enum(Object.keys(bindingLabels) as [keyof typeof bindingLabels, ...(keyof typeof bindingLabels)[]]), image: z.string(), columns: z.array(z.strictObject({ field: z.enum(Object.keys(columnLabels) as [keyof typeof columnLabels, ...(keyof typeof columnLabels)[]]), label: z.string().max(80), width: z.number().min(3).max(100) })).max(8) })
export const layoutSchema = z.strictObject({ version: z.literal(1), orientation: z.enum(['portrait', 'landscape']), margin: z.number().min(8).max(30), headerHeight: z.number().min(0).max(150), footerHeight: z.number().min(0).max(100), background: z.strictObject({ color, image: z.string().max(1500000).refine((value) => !value || /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(value), 'Utilisez une image PNG, JPEG ou WebP intégrée.'), opacity: z.number().min(0).max(1), fit: z.enum(['contain', 'cover']) }).optional(), headings: z.array(styleSchema).length(3), blocks: z.array(blockSchema).max(80) }).superRefine((layout, ctx) => {
  const width = printableWidth(layout)
  const ids = new Set<string>()
  for (const block of layout.blocks) {
    if (ids.has(block.id)) ctx.addIssue({ code: 'custom', message: 'Identifiants de blocs dupliqués.' }); ids.add(block.id)
    if (block.x + block.width > width + 1) ctx.addIssue({ code: 'custom', message: 'Un bloc dépasse la largeur imprimable.' })
    if (block.zone !== 'body' && block.y + block.height > (block.zone === 'header' ? layout.headerHeight : layout.footerHeight)) ctx.addIssue({ code: 'custom', message: 'Un bloc dépasse sa zone fixe.' })
    if (block.sameLine && (block.zone !== 'body' || ['table', 'pageBreak'].includes(block.kind))) ctx.addIssue({ code: 'custom', message: 'Ce bloc doit démarrer une nouvelle ligne.' })
    if (block.tableHeadings && block.kind !== 'table') ctx.addIssue({ code: 'custom', message: 'Les styles des sections appartiennent à un tableau.' })
    if (block.kind === 'table' && (!block.columns.some((column) => column.field === 'description') || Math.abs(block.columns.reduce((sum, column) => sum + column.width, 0) - 100) > 0.1)) ctx.addIssue({ code: 'custom', message: 'Largeurs du tableau : total attendu 100 %, avec une description.' })
  }
})
export const templateSchema = z.object({ id: z.string(), name: z.string(), status: z.enum(['draft', 'published', 'archived']), updated: z.string(), current_version: z.string(), version: z.number(), content_json: layoutSchema })
export const templateChoiceSchema = z.object({ id: z.string(), name: z.string(), version: z.number(), current_version: z.string(), status: z.enum(['draft', 'published', 'archived']).optional() })
export type Layout = z.infer<typeof layoutSchema>
export type Block = z.infer<typeof blockSchema>
export type TextStyle = z.infer<typeof styleSchema>
export type Template = z.infer<typeof templateSchema>
export type TemplateChoice = z.infer<typeof templateChoiceSchema>
export const baseStyle: TextStyle = { font: 'Inter', size: 12, color: '#091C3A', background: '#FFFFFF', backgroundOpacity: 0, align: 'left', bold: false, italic: false, uppercase: false, border: false }
export function printableWidth(layout: { orientation: 'portrait' | 'landscape'; margin: number }) { return Math.floor((layout.orientation === 'portrait' ? 794 : 1123) - layout.margin * 96 / 25.4 * 2) }
export function newBlock(kind: Block['kind'], width: number): Block {
  return { id: crypto.randomUUID(), kind, zone: kind === 'pageNumber' ? 'footer' : 'body', x: 0, y: kind === 'pageNumber' ? 0 : 12, width: Math.floor(width), height: kind === 'image' ? 60 : kind === 'table' ? 0 : 24, style: { ...baseStyle }, text: kind === 'text' ? 'Votre texte' : '', content: null, field: 'company.name', image: '', columns: [ { field: 'description', label: 'Description', width: 42 }, { field: 'brand', label: 'Marque', width: 12 }, { field: 'reference', label: 'Référence', width: 12 }, { field: 'quantity', label: 'Qté', width: 7 }, { field: 'unit', label: 'u.', width: 5 }, { field: 'unit_price', label: 'PU HT', width: 10 }, { field: 'line_total', label: 'Total HT', width: 12 } ] }
}
export function defaultLayout(): Layout {
  const layout: Layout = { version: 1, orientation: 'portrait', margin: 12, headerHeight: 80, footerHeight: 30, headings: [{ ...baseStyle, size: 15, bold: true, border: true, color: '#7B3FC7' }, { ...baseStyle, size: 13, bold: true, background: '#FCEAF3', backgroundOpacity: 1 }, { ...baseStyle, bold: true, background: '#F4F5F7', backgroundOpacity: 1 }], blocks: [] }
  const width = printableWidth(layout)
  const title = newBlock('field', width); title.field = 'quote.quote_number'; title.style = { ...baseStyle, size: 24, bold: true, color: '#7B3FC7' }
  const client = newBlock('field', width); client.field = 'company.name'
  const page = newBlock('pageNumber', width); page.style.align = 'right'
  const totals = (['quote.subtotal', 'quote.tax', 'quote.total'] as const).map((field) => { const block = newBlock('field', width); block.field = field; block.text = `${bindingLabels[field]} : `; block.style.align = 'right'; block.style.bold = field === 'quote.total'; return block })
  const terms = (['quote.terms_label', 'quote.terms_content'] as const).map((field) => { const block = newBlock('field', width); block.field = field; block.style.bold = field === 'quote.terms_label'; return block })
  layout.blocks = [title, client, newBlock('table', width), ...totals, ...terms, page]
  return layout
}

export const blockLabels = { text: 'Texte', field: 'Champ lié', image: 'Logo / image', table: 'Tableau', totals: 'Totaux', terms: 'Conditions de vente', separator: 'Séparateur', spacer: 'Espacement', pageBreak: 'Saut de page', pageNumber: 'Numérotation' }
/** Keep the full table printable while changing one column's proportion. */
export function resizeColumns(columns: Block['columns'], field: Block['columns'][number]['field'], requested: number): Block['columns'] {
  if (!columns.length) return []
  if (columns.length === 1) return [{ ...columns[0]!, width: 100 }]
  const width = Math.max(3, Math.min(100 - (columns.length - 1) * 3, requested))
  const others = columns.filter((column) => column.field !== field)
  const weight = others.reduce((sum, column) => sum + Math.max(0, column.width - 3), 0)
  const remainder = 100 - width - others.length * 3
  const resized = columns.map((column) => ({ ...column, width: column.field === field ? width : 3 + remainder * (weight ? Math.max(0, column.width - 3) / weight : 1 / others.length) }))
  const last = resized.findLast((column) => column.field !== field)!
  last.width += 100 - resized.reduce((sum, column) => sum + column.width, 0)
  return resized.map((column) => ({ ...column, width: Math.round(column.width * 10000) / 10000 }))
}

/** Contiguous blocks share a flow row; ungrouped v1 layouts retain their original flow. */
export function bodyRows(blocks: Block[]): Block[][] {
  const rows: Block[][] = []
  for (const block of blocks.filter((item) => item.zone === 'body')) {
    const previous = rows.at(-1)
    if (block.sameLine && previous && ![...previous, block].some((item) => ['table', 'pageBreak'].includes(item.kind))) previous.push(block)
    else rows.push([block])
  }
  return rows
}
export function setSameLine(layout: Layout, id: string, join: boolean): Layout {
  const blocks = layout.blocks.map((block) => ({ ...block }))
  const block = blocks.find((item) => item.id === id)
  if (!block) return layout
  if (!join) { block.sameLine = false; block.x = 0; return { ...layout, blocks } }
  const body = blocks.filter((item) => item.zone === 'body'), index = body.indexOf(block)
  const row = bodyRows(body.slice(0, index)).at(-1)
  if (!row || [...row, block].some((item) => ['table', 'pageBreak'].includes(item.kind))) return layout
  block.sameLine = true
  const siblings = [...row, block], gap = 12, width = Math.floor((printableWidth(layout) - gap * (siblings.length - 1)) / siblings.length)
  for (const [position, item] of siblings.entries()) { item.width = width; item.x = position * (width + gap); item.y = row[0]!.y }
  return { ...layout, blocks }
}

/** Resolve anchors without changing a published layout. */
export function placedBlock(layout: Layout, block: Block): Block {
  const width = printableWidth(layout), fixedHeight = block.zone === 'header' ? layout.headerHeight : layout.footerHeight
  return { ...block, x: block.anchorX ? block.anchorX === 'left' ? 0 : Math.floor((width - block.width) / (block.anchorX === 'center' ? 2 : 1)) : block.x, y: block.anchorY ? block.anchorY === 'bottom' && block.zone !== 'body' ? Math.max(0, fixedHeight - block.height) : 0 : block.y }
}
export function dockBlock(layout: Layout, id: string, edge: 'left' | 'center' | 'right' | 'top' | 'bottom'): Layout {
  let blocks = layout.blocks.map((block) => block.id !== id ? block : placedBlock(layout, { ...block, ...((edge === 'top' || edge === 'bottom') ? { anchorY: edge } : { anchorX: edge }) }))
  const block = blocks.find((item) => item.id === id)
  if (block?.zone === 'body' && (edge === 'top' || edge === 'bottom')) {
    const row = bodyRows(blocks).find((items) => items.some((item) => item.id === id))!
    blocks = blocks.filter((item) => !row.includes(item))
    const remaining = blocks.filter((item) => item.zone === 'body')
    const target = edge === 'top' ? remaining[0] : remaining.at(-1)
    const index = target ? blocks.indexOf(target) + (edge === 'bottom' ? 1 : 0) : blocks.length
    blocks.splice(index, 0, ...row.map((item, index) => placedBlock(layout, { ...item, anchorY: edge, sameLine: index > 0 })))
  }
  return { ...layout, blocks }
}
export function duplicateBlock(layout: Layout, id: string): { layout: Layout; id: string } {
  const block = layout.blocks.find((item) => item.id === id)
  if (!block || layout.blocks.length >= 80) return { layout, id }
  const copy: Block = { ...structuredClone(block), id: crypto.randomUUID(), sameLine: false, anchorY: undefined }
  let index = layout.blocks.indexOf(block) + 1
  let headerHeight = layout.headerHeight, footerHeight = layout.footerHeight
  if (block.zone === 'body') {
    const row = bodyRows(layout.blocks).find((items) => items.some((item) => item.id === id))!
    index = layout.blocks.indexOf(row.at(-1)!) + 1
    copy.y = 12
  } else {
    const required = block.y + block.height * 2 + 8, limit = block.zone === 'header' ? 150 : 100
    if (required <= limit) { copy.y = block.y + block.height + 8; if (block.zone === 'header') headerHeight = Math.max(headerHeight, required); else footerHeight = Math.max(footerHeight, required) }
    else return { layout, id }
  }
  const blocks = [...layout.blocks]; blocks.splice(index, 0, copy)
  return { layout: { ...layout, blocks, headerHeight, footerHeight }, id: copy.id }
}
export function reorderBlock(layout: Layout, id: string, target: string, after: boolean): Layout {
  if (id === target) return layout
  const block = layout.blocks.find((item) => item.id === id), destination = layout.blocks.find((item) => item.id === target)
  if (!block || !destination || block.zone !== destination.zone) return layout
  const index = layout.blocks.indexOf(block), blocks = layout.blocks.filter((item) => item.id !== id)
  if (blocks[index]?.sameLine) blocks[index] = { ...blocks[index]!, sameLine: block.sameLine ?? false }
  const to = blocks.findIndex((item) => item.id === target) + (after ? 1 : 0)
  blocks.splice(to, 0, { ...block, sameLine: false, anchorY: undefined })
  return { ...layout, blocks }
}

export const libraryKinds: Block['kind'][] = ['text', 'field', 'image', 'table', 'separator', 'spacer', 'pageBreak', 'pageNumber']
/** Expand only the editor's working copy. Published snapshots are never rewritten. */
export function expandLegacyBlocks(layout: Layout): Layout {
  return { ...layout, blocks: layout.blocks.flatMap((block) => {
    if (block.kind === 'text' && (block.style.bold || block.style.italic)) {
      const migrate = (node: RichTextNode): RichTextNode => ({ ...node, ...(node.type === 'text' ? { marks: [...(node.marks || []).filter((mark) => !(mark.type === 'bold' && block.style.bold || mark.type === 'italic' && block.style.italic)), ...(block.style.bold ? [{ type: 'bold' }] : []), ...(block.style.italic ? [{ type: 'italic' }] : [])] } : {}), ...(node.content ? { content: node.content.map(migrate) } : {}) })
      return [{ ...block, content: migrate(block.content || plainTextDocument(block.text)), style: { ...block.style, bold: false, italic: false } }]
    }
    if (!['totals', 'terms'].includes(block.kind)) return [block]
    const fields: { field: Block['field']; text: string; bold?: boolean }[] = block.kind === 'totals' ? [{ field: 'quote.subtotal_before_discount', text: 'HT avant remise : ' }, { field: 'quote.discount_amount', text: 'Remise : ' }, { field: 'quote.subtotal', text: 'Total HT : ' }, { field: 'quote.tax', text: 'TVA : ' }, { field: 'quote.total', text: 'Total TTC : ', bold: true }, { field: 'quote.options_total', text: 'Options HT : ' }] : [{ field: 'quote.terms_label', text: '', bold: true }, { field: 'quote.terms_content', text: '' }]
    return fields.map((value, index) => ({ ...block, id: index ? crypto.randomUUID() : block.id, kind: 'field' as const, field: value.field, text: value.text, sameLine: false, anchorY: index ? undefined : block.anchorY, y: index ? 4 : block.y, height: 20, content: null, style: { ...block.style, bold: Boolean(value.bold), ...(block.kind === 'totals' ? { align: 'right' as const } : {}) } }))
  }) }
}
export function fitImage(block: Block, naturalWidth: number, naturalHeight: number, maxWidth: number, maxHeight: number): Block {
  const ratio = naturalWidth / naturalHeight, width = Math.max(20, Math.min(naturalWidth, maxWidth, maxHeight * ratio))
  return { ...block, imageRatio: ratio, lockAspect: true, width: Math.round(width * 100) / 100, height: Math.round(width / ratio * 100) / 100 }
}
export function resizeBlock(block: Block, requestedWidth: number, requestedHeight: number, maxWidth: number, maxHeight: number, axis: 'width' | 'height' = 'width'): Block {
  if (block.kind === 'image' && block.imageRatio && block.lockAspect !== false) {
    const ratio = block.imageRatio, width = Math.max(20, Math.min(maxWidth, maxHeight * ratio, axis === 'height' ? requestedHeight * ratio : requestedWidth))
    return { ...block, width: Math.round(width * 100) / 100, height: Math.round(width / ratio * 100) / 100 }
  }
  return { ...block, width: Math.max(20, Math.min(maxWidth, requestedWidth)), height: Math.max(0, Math.min(maxHeight, requestedHeight)) }
}
