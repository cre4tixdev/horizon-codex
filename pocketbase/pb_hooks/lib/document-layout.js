const fields = ['stock.purchase_number', 'stock.supplier_name', 'stock.supplier_address', 'stock.label', 'stock.number', 'stock.title', 'stock.document_date', 'stock.planned_date', 'stock.destination', 'stock.warehouse', 'stock.state', 'purchase.buyer_name', 'purchase.buyer_email', 'purchase.delivery_warehouse', 'purchase.delivery_warehouse_code', 'purchase.number', 'purchase.title', 'purchase.document_date', 'purchase.needed_date', 'purchase.currency', 'purchase.subtotal', 'purchase.tax_rate', 'purchase.tax', 'purchase.total', 'purchase.notes', 'product.name', 'product.reference', 'product.brand', 'product.barcode', 'product.description', 'product.unit', 'quote.quote_number', 'quote.title', 'quote.quote_date', 'quote.valid_until', 'quote.validity_days', 'quote.currency', 'quote.subtotal_before_discount', 'quote.discount_amount', 'quote.subtotal', 'quote.tax_rate', 'quote.tax', 'quote.total', 'quote.options_total', 'quote.terms_label', 'quote.terms_content', 'company.name', 'company.vat_number', 'company.legal_name', 'company.email', 'company.phone', 'company.siret', 'company.address', 'company.line1', 'company.line2', 'company.postal_code', 'company.city', 'company.country', 'company.country_name', 'company.state_region', 'opportunity.title', 'opportunity.number', 'owner.name', 'contact.name', 'contact.email', 'contact.phone']
const columns = ['traceability', 'affairs', 'destination', 'description', 'brand', 'reference', 'quantity', 'unit', 'unit_price', 'discount', 'line_total']
const keys = (value, allowed) => { if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some((key) => !allowed.includes(key))) throw new BadRequestError('Structure du modèle invalide.') }
const numeric = (value, min, max) => { if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new BadRequestError('Dimensions du modèle invalides.') }
const color = (value) => { if (!/^#[a-f0-9]{6}$/i.test(value || '')) throw new BadRequestError('Couleur du modèle invalide.') }
const style = (value) => {
  keys(value, ['font', 'size', 'color', 'background', 'backgroundOpacity', 'align', 'bold', 'italic', 'uppercase', 'border', 'borders'])
  if (value.borders !== undefined) {
    keys(value.borders, ['top', 'bottom', 'left', 'right', 'color', 'width'])
    if (['top', 'bottom', 'left', 'right'].some((side) => typeof value.borders[side] !== 'boolean')) throw new BadRequestError('Côtés de bordure invalides.')
    color(value.borders.color); numeric(value.borders.width, 0, 10)
  }
  if (!['Inter', 'Montserrat', 'Arial', 'Roboto', 'Open Sans', 'Lato', 'Source Sans 3', 'Noto Serif'].includes(value.font)) throw new BadRequestError('Police du modèle invalide.')
  if (value.backgroundOpacity !== undefined) numeric(value.backgroundOpacity, 0, 1)
  numeric(value.size, 8, 48); color(value.color); color(value.background)
  if (!['left', 'center', 'right'].includes(value.align) || ['bold', 'italic', 'uppercase', 'border'].some((key) => typeof value[key] !== 'boolean')) throw new BadRequestError('Style du modèle invalide.')
}
const pageDimensions = (layout) => {
  const size = layout.pageSize || { width: 210, height: 297 }
  return { ...(layout.pageSize?.name ? { name: layout.pageSize.name } : {}), format: layout.pageSize ? 'Personnalisé' : 'A4', orientation: layout.orientation, width: layout.orientation === 'portrait' ? size.width : size.height, height: layout.orientation === 'portrait' ? size.height : size.width }
}
const validate = (layout) => {
  if (JSON.stringify(layout).length > 2800000) throw new BadRequestError('Le modèle est trop volumineux.')
  keys(layout, ['version', 'orientation', 'margin', 'headerHeight', 'footerHeight', 'headings', 'blocks', 'background', 'pageSize'])
  if (layout.version !== 1 || !['portrait', 'landscape'].includes(layout.orientation)) throw new BadRequestError('Format du modèle invalide.')
  if (layout.pageSize !== undefined) { keys(layout.pageSize, ['width', 'height', 'formatId', 'name']); if (layout.pageSize.formatId !== undefined && !/^[a-z0-9]{15}$/.test(layout.pageSize.formatId) || layout.pageSize.name !== undefined && (typeof layout.pageSize.name !== 'string' || !layout.pageSize.name.trim() || layout.pageSize.name.length > 80)) throw new BadRequestError('Format de papier invalide.'); numeric(layout.pageSize.width, 10, 1000); numeric(layout.pageSize.height, 10, 1000) }
  numeric(layout.margin, 0, 30); numeric(layout.headerHeight, 0, 150); numeric(layout.footerHeight, 0, 100)
  if (!Array.isArray(layout.headings) || layout.headings.length !== 3) throw new BadRequestError('Trois styles de titres sont requis.')
  layout.headings.forEach(style)
  if (layout.background !== undefined) {
    const background = layout.background
    keys(background, ['color', 'image', 'opacity', 'fit']); color(background.color); numeric(background.opacity, 0, 1)
    if (!['contain', 'cover'].includes(background.fit) || typeof background.image !== 'string' || background.image && (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(background.image) || background.image.length > 1500000)) throw new BadRequestError('Fond de page invalide.')
  }
  if (!Array.isArray(layout.blocks) || layout.blocks.length > 80) throw new BadRequestError('80 blocs maximum.')
  const page = pageDimensions(layout), width = (layout.pageSize ? page.width * 96 / 25.4 : layout.orientation === 'portrait' ? 794 : 1123) - layout.margin * 96 / 25.4 * 2, ids = new Set()
  if (width < 20 || page.height * 96 / 25.4 - layout.margin * 96 / 25.4 * 2 - layout.headerHeight - layout.footerHeight < 20) throw new BadRequestError('Les marges et zones fixes ne laissent pas assez de place pour le contenu.')
  for (const block of layout.blocks) {
    keys(block, ['id', 'sameLine', 'anchorX', 'anchorY', 'imageRatio', 'lockAspect', 'tableSource', 'tableHeadings', 'tableHeader', 'tableLine', 'tableNote', 'tableSubtitle', 'kind', 'zone', 'x', 'y', 'width', 'height', 'style', 'text', 'content', 'field', 'image', 'columns'])
    if (!/^[a-zA-Z0-9-]{1,100}$/.test(block.id || '') || ids.has(block.id)) throw new BadRequestError('Identifiant de bloc invalide.')
    ids.add(block.id)
    if (!['text', 'field', 'barcode', 'image', 'table', 'totals', 'terms', 'separator', 'spacer', 'pageBreak', 'pageNumber'].includes(block.kind) || !['header', 'body', 'footer'].includes(block.zone)) throw new BadRequestError('Bloc invalide.')
    if (['table', 'totals', 'terms', 'pageBreak'].includes(block.kind) && block.zone !== 'body') throw new BadRequestError('Ce bloc appartient au corps de la pièce.')
    numeric(block.x, 0, width); numeric(block.y, 0, 200); numeric(block.width, 20, width); numeric(block.height, 0, 400)
    if (block.x + block.width > width + 1) throw new BadRequestError('Le bloc dépasse la largeur imprimable.')
    if (block.zone !== 'body' && block.y + block.height > (block.zone === 'header' ? layout.headerHeight : layout.footerHeight)) throw new BadRequestError('Le bloc dépasse sa zone d’en-tête ou de pied de page.')
    if (block.sameLine !== undefined && typeof block.sameLine !== 'boolean' || block.tableSource !== undefined && !['sales.quote_lines', 'purchasing.order_lines', 'inventory.operation_lines'].includes(block.tableSource)) throw new BadRequestError('Disposition ou source du tableau invalide.')
    if (block.sameLine && (block.zone !== 'body' || ['table', 'pageBreak'].includes(block.kind))) throw new BadRequestError('Ce bloc doit démarrer une nouvelle ligne.')
    if (block.anchorX !== undefined && !['left', 'center', 'right'].includes(block.anchorX) || block.anchorY !== undefined && !['top', 'bottom'].includes(block.anchorY)) throw new BadRequestError('Ancrage du bloc invalide.')
    if (block.imageRatio !== undefined) numeric(block.imageRatio, 0.0001, 10000)
    if (block.lockAspect !== undefined && typeof block.lockAspect !== 'boolean') throw new BadRequestError('Proportions de l’image invalides.')
    if (block.tableHeadings !== undefined) {
      if (block.kind !== 'table' || !Array.isArray(block.tableHeadings) || block.tableHeadings.length !== 3) throw new BadRequestError('Les styles de sections appartiennent à un tableau et doivent comporter trois niveaux.')
      block.tableHeadings.forEach(style)
    }
    for (const property of ['tableHeader', 'tableLine', 'tableNote', 'tableSubtitle']) {
      if (block[property] !== undefined) {
        if (block.kind !== 'table') throw new BadRequestError('Les styles de lignes appartiennent à un tableau.')
        style(block[property])
      }
    }
    style(block.style)
    if (typeof block.text !== 'string' || block.text.length > 10000) throw new BadRequestError('Texte trop long.')
    if (block.content !== null) require(`${__hooks}/lib/rich-text.js`)(block.content)
    if (['field', 'barcode'].includes(block.kind) && !fields.includes(block.field)) throw new BadRequestError('Champ documentaire non autorisé.')
    if (typeof block.image !== 'string' || block.image && (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(block.image) || block.image.length > 1500000)) throw new BadRequestError('Utilisez une image PNG, JPEG ou WebP de moins de 1 Mo.')
    if (!Array.isArray(block.columns) || block.columns.length > 8) throw new BadRequestError('Colonnes invalides.')
    const columnKeys = new Set()
    for (const column of block.columns) {
      keys(column, ['field', 'label', 'width']); numeric(column.width, 3, 100)
      if (!columns.includes(column.field) || columnKeys.has(column.field) || typeof column.label !== 'string' || column.label.length > 80) throw new BadRequestError('Colonne documentaire invalide.')
      columnKeys.add(column.field)
    }
    if (block.kind === 'table' && (!columnKeys.has('description') || Math.abs(block.columns.reduce((sum, item) => sum + item.width, 0) - 100) > 0.1)) throw new BadRequestError('Le tableau doit contenir une description et des largeurs totalisant 100 %.')
  }
  return layout
}
module.exports = { validate, fields, columns, pageDimensions }
