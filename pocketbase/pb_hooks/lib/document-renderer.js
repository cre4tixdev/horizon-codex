const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
const rich = (node, headings) => {
  if (!node) return ''
  if (node.type === 'text') return (node.marks || []).reduce((html, mark) => `<${({ bold: 'strong', italic: 'em', underline: 'u', strike: 's' })[mark.type]}>${html}</${({ bold: 'strong', italic: 'em', underline: 'u', strike: 's' })[mark.type]}>`, escape(node.text))
  if (node.type === 'hardBreak') return '<br>'
  if (node.type === 'horizontalRule') return '<hr>'
  const content = (node.content || []).map((child) => rich(child, headings)).join('')
  if (node.type === 'doc') return content
  const tag = ({ paragraph: 'p', heading: `h${node.attrs?.level || 2}`, bulletList: 'ul', orderedList: 'ol', listItem: 'li', blockquote: 'blockquote' })[node.type]
  return `<${tag}${node.type === 'heading' ? ` style="${cssStyle(headings[(node.attrs?.level || 2) - 1])}"` : ''}>${content}</${tag}>`
}
const backgroundColor = (style) => style.backgroundOpacity === undefined || style.backgroundOpacity === 1 ? style.background : `rgba(${[1, 3, 5].map((start) => parseInt(style.background.slice(start, start + 2), 16)).join(',')},${style.backgroundOpacity})`
const cssStyle = (style) => `font-family:'${style.font}',sans-serif;font-size:${style.size}px;color:${style.color};background:${backgroundColor(style)};text-align:${style.align};font-weight:${style.bold ? 600 : 400};font-style:${style.italic ? 'italic' : 'normal'};text-transform:${style.uppercase ? 'uppercase' : 'none'};${style.border ? 'border-bottom:1px solid currentColor;' : ''}`
module.exports = (layout, context) => {
  require(`${__hooks}/lib/document-layout.js`).validate(layout)
  const data = context.fields, currency = String(data['quote.currency'] || 'EUR')
  // JSVM has no Intl; explicit formatting is deterministic on the server.
  const money = (value, unit = false) => { const parts = Number(value || 0).toFixed(6).split('.'); const amount = unit ? parts[0] + ',' + parts[1].replace(/0+$/, '').padEnd(2, '0') : Number(value || 0).toFixed(2).replace('.', ','); return `${amount} ${({ EUR: '€', USD: '$', GBP: '£', CHF: 'CHF', CAD: '$ CA' })[currency] || escape(currency)}` }
  const date = (value) => String(value || '').slice(0, 10).split('-').reverse().join('/')
  const value = (key) => ['quote.quote_date', 'quote.valid_until'].includes(key) ? date(data[key]) : ['quote.subtotal_before_discount', 'quote.discount_amount', 'quote.subtotal', 'quote.tax', 'quote.total', 'quote.options_total'].includes(key) ? money(data[key]) : escape(data[key])
  const table = (block) => {
    const head = `<colgroup>${block.columns.map((column) => `<col style="width:${column.width}%">`).join('')}</colgroup><thead><tr>${block.columns.map((column) => `<th${block.tableHeader ? ` style="${cssStyle(block.tableHeader)}"` : ''}>${escape(column.label)}</th>`).join('')}</tr></thead>`
    const body = context.lines.map((line) => {
      if (['section', 'subsection', 'subsection3', 'note'].includes(line.kind)) {
        const level = ['section', 'subsection', 'subsection3'].indexOf(line.kind)
        const amount = line.show_total ? `${money(line.section_total)}${line.section_options_total ? ` (${money(line.section_options_total)})` : ''}` : ''
        return `<tr class="section"><td colspan="${block.columns.length}" style="${level >= 0 ? cssStyle((block.tableHeadings || layout.headings)[level]) : block.tableNote ? cssStyle(block.tableNote) : 'font-style:italic;'}"><span>${escape(line.description)}</span>${amount ? `<span style="float:right">${amount}</span>` : ''}</td></tr>`
      }
      return `<tr>${block.columns.map((column) => `<td class="${['unit_price', 'line_total', 'quantity', 'discount'].includes(column.field) ? 'number' : ''}"${block.tableLine ? ` style="${cssStyle(block.tableLine)}${['unit_price', 'line_total', 'quantity', 'discount'].includes(column.field) ? 'text-align:right;' : ''}"` : ''}>${column.field === 'description' ? `${escape(line.description)}${line.is_option ? ' <small>(option)</small>' : ''}` : ['unit_price', 'line_total'].includes(column.field) ? money(line[column.field], column.field === 'unit_price') : escape(line[column.field])}</td>`).join('')}</tr>`
    }).join('')
    return `<table class="lines">${head}<tbody>${body}</tbody></table>`
  }
  const content = (block) => {
    if (block.kind === 'text') return block.content ? rich(block.content, layout.headings) : escape(block.text).replace(/\n/g, '<br>')
    if (block.kind === 'field') return (escape(block.text) + value(block.field)).replace(/\n/g, '<br>')
    if (block.kind === 'image') return block.image ? `<img src="${block.image}" alt="" style="width:100%;height:${block.height || 60}px;object-fit:contain;object-position:${block.style.align} center">` : ''
    if (block.kind === 'table') return table(block)
    if (block.kind === 'totals') return `<div class="totals">${[...(Number(data['quote.discount_amount']) ? [['HT avant remise', 'quote.subtotal_before_discount'], ['Remise globale', 'quote.discount_amount']] : []), ['Total HT', 'quote.subtotal'], [`TVA ${escape(data['quote.tax_rate'])} %`, 'quote.tax'], ['Total TTC', 'quote.total'], ...(Number(data['quote.options_total']) ? [['Options HT', 'quote.options_total']] : [])].map(([label, key]) => `<div><span>${label}</span><strong>${money(data[key])}</strong></div>`).join('')}</div>`
    if (block.kind === 'terms') return `<h3>${escape(data['quote.terms_label'] || 'Conditions de vente')}</h3>${escape(data['quote.terms_content']).replace(/\n/g, '<br>')}`
    if (block.kind === 'separator') return '<hr>'
    if (block.kind === 'pageNumber') return 'Page <span class="pageNumber">1</span> / <span class="totalPages">1</span>'
    return ''
  }
  const width = layout.orientation === 'portrait' ? 794 : 1123, margin = layout.margin * 96 / 25.4
  const placed = (block) => ({ ...block, x: block.anchorX ? block.anchorX === 'left' ? 0 : Math.floor((Math.floor(width - margin * 2) - block.width) / (block.anchorX === 'center' ? 2 : 1)) : block.x, y: block.anchorY ? block.anchorY === 'bottom' && block.zone !== 'body' ? Math.max(0, (block.zone === 'header' ? layout.headerHeight : layout.footerHeight) - block.height) : 0 : block.y })
  const zone = (name) => {
    const blocks = layout.blocks.filter((block) => block.zone === name).map(placed), rows = []
    for (const block of blocks) {
      const previous = rows[rows.length - 1]
      if (name === 'body' && block.sameLine && previous && !previous.concat(block).some((item) => ['table', 'pageBreak'].includes(item.kind))) previous.push(block)
      else rows.push([block])
    }
    const render = (block, grouped) => `<div data-block-id="${escape(block.id)}" style="${cssStyle(block.style)};${name === 'body' ? `position:relative;${grouped ? 'grid-area:1/1;' : ''}margin-left:${block.x}px;margin-top:${block.y}px;min-height:${block.height}px;${block.kind === 'pageBreak' ? 'break-before:page;' : ''}` : `position:absolute;left:${block.x}px;top:${block.y}px;height:${block.height}px;`}width:${block.width}px;white-space:pre-wrap;overflow-wrap:anywhere;${['totals', 'text', 'field', 'image'].includes(block.kind) ? 'break-inside:avoid;' : ''}">${content(block)}</div>`
    return rows.map((row) => name === 'body' ? `<div class="document-flow-row" style="${row.length > 1 ? 'display:grid;grid-template-columns:100%;break-inside:avoid;' : 'display:flow-root;'}${row.some((block) => block.anchorY === 'bottom') ? 'margin-top:auto;' : ''}">${row.map((block) => render(block, row.length > 1)).join('')}</div>` : render(row[0], false)).join('')
  }
  const fontData = $os.readFile(`${__hooks}/assets/document-fonts.css`)
  const fonts = typeof fontData === 'string' ? fontData : fontData.map((byte) => String.fromCharCode(byte)).join('')
  const css = `${fonts}*{box-sizing:border-box}body{margin:0;font:12px Inter,sans-serif;color:#091c3a}p{margin:0 0 5px}h1,h2,h3{margin:0 0 6px}hr{border:0;border-top:1px solid #dce3ec}img{max-width:100%;display:block}.lines{width:100%;border-collapse:collapse;table-layout:fixed}.lines thead{display:table-header-group}.lines th{background:#edf1f7;text-align:left;font-size:11px}.lines td,.lines th{padding:6px 5px;border-bottom:1px solid #e4e8ef;overflow-wrap:anywhere;white-space:pre-wrap}.lines tr{break-inside:avoid}.lines .section{break-after:avoid}.lines .number{text-align:right}.totals{margin-left:auto;max-width:310px;border-top:2px solid #7b3fc7;padding-top:8px}.totals div{display:flex;justify-content:space-between;gap:20px;padding:5px 0}.totals strong{font-size:13px}small{color:#7b8794}strong{font-weight:600}.document-flow-row{flex:none}blockquote{margin:0 0 6px;padding-left:12px;border-left:2px solid #dce3ec}ul{list-style:disc;padding-left:24px}ol{list-style:decimal;padding-left:24px}`
  const pageHeight = layout.orientation === 'portrait' ? 1123 : 794
  // Each print document receives the same full-page layer, cropped in the repeated header/footer.
  const backdrop = (position, top = 0, left = 0) => layout.background ? `<div aria-hidden="true" class="document-paper-background" style="position:${position};top:${top}px;left:${left}px;width:${width}px;height:${pageHeight}px;opacity:${layout.background.opacity};background:${layout.background.color};pointer-events:none;z-index:-1;">${layout.background.image ? `<img alt="" src="${layout.background.image}" style="width:100%;height:100%;object-fit:${layout.background.fit};">` : ''}</div>` : ''
  const html = (body) => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>${css}</style></head><body>${body}</body></html>`
  // Chromium prints these templates above the body. Clip their full-page background
  // to each reserved zone so the footer cannot paint over the document or its logo.
  const header = html(`<div style="position:relative;isolation:isolate;overflow:hidden;width:${width}px;height:${layout.headerHeight}px;padding-inline:${margin}px">${backdrop('absolute', -margin)}<div style="position:relative;height:100%">${zone('header')}</div></div>`)
  const footer = html(`<div style="position:relative;isolation:isolate;overflow:hidden;width:${width}px;height:${layout.footerHeight}px;padding-inline:${margin}px">${backdrop('absolute', -(pageHeight - margin - layout.footerHeight))}<div style="position:relative;height:100%">${zone('footer')}</div></div>`)
  const body = html(`<main style="position:relative;isolation:isolate;min-height:${Math.floor((layout.orientation === 'portrait' ? 1122 : 793) - margin * 2 - layout.headerHeight - layout.footerHeight)}px;display:flex;flex-direction:column">${backdrop('fixed', -(margin + layout.headerHeight), -margin)}${zone('body')}</main>`)
  const preview = html(`<main style="position:relative;isolation:isolate;background:#fff;width:${width}px;min-height:${layout.orientation === 'portrait' ? 1123 : 794}px;padding:${margin}px;margin:auto;display:flex;flex-direction:column">${backdrop('absolute')}<header style="height:${layout.headerHeight}px;position:relative;flex:none">${zone('header')}</header><section style="flex:1;display:flex;flex-direction:column">${zone('body')}</section><footer style="height:${layout.footerHeight}px;position:relative;flex:none">${zone('footer')}</footer></main>`)
  return { body, header, footer, preview }
}
