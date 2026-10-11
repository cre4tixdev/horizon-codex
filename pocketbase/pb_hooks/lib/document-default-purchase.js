module.exports = () => {
  const style = { font: 'Inter', size: 12, color: '#091C3A', background: '#FFFFFF', backgroundOpacity: 0, align: 'left', bold: false, italic: false, uppercase: false, border: false }
  const block = (id, kind, field, height, text = '', extra = {}) => ({ id, kind, field, height, zone: 'body', x: 0, y: 8, width: 703, style, text, content: null, image: '', columns: [], ...extra })
  return { version: 1, orientation: 'portrait', margin: 12, headerHeight: 0, footerHeight: 22, headings: [style, style, style], blocks: [
    block('title', 'text', 'purchase.number', 28, 'COMMANDE FOURNISSEUR', { style: { ...style, size: 20, bold: true } }),
    block('number', 'field', 'purchase.number', 20), block('supplier', 'field', 'company.name', 20, '', { style: { ...style, bold: true } }), block('address', 'field', 'company.address', 48), block('date', 'field', 'purchase.document_date', 20), block('analytic', 'field', 'opportunity.number', 20),
    block('lines', 'table', 'purchase.number', 0, '', { tableSource: 'purchasing.order_lines', columns: [{ field: 'description', label: 'Description', width: 38 }, { field: 'brand', label: 'Marque', width: 12 }, { field: 'reference', label: 'Référence', width: 12 }, { field: 'quantity', label: 'Qté', width: 7 }, { field: 'unit', label: 'u.', width: 5 }, { field: 'unit_price', label: 'PU HT', width: 12 }, { field: 'line_total', label: 'Total HT', width: 14 }] }),
    block('total-label', 'text', 'purchase.subtotal', 22, 'Total HT', { width: 530, style: { ...style, align: 'right' } }), block('total-ht', 'field', 'purchase.subtotal', 22, '', { sameLine: true, x: 545, width: 158, style: { ...style, align: 'right' } }),
    block('tax-label', 'text', 'purchase.tax', 22, 'TVA', { width: 530, style: { ...style, align: 'right' } }), block('tax', 'field', 'purchase.tax', 22, '', { sameLine: true, x: 545, width: 158, style: { ...style, align: 'right' } }),
    block('ttc-label', 'text', 'purchase.total', 22, 'Total TTC', { width: 530, style: { ...style, align: 'right', bold: true } }), block('ttc', 'field', 'purchase.total', 22, '', { sameLine: true, x: 545, width: 158, style: { ...style, align: 'right', bold: true } }),
    block('pages', 'pageNumber', 'purchase.number', 18, '', { zone: 'footer', y: 0, style: { ...style, size: 10, align: 'right' } }),
  ] }
}
