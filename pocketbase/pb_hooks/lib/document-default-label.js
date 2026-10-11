// Standard label, available before an administrator publishes a custom studio model.
module.exports = () => {
  const style = { font: 'Inter', size: 10, color: '#000000', background: '#FFFFFF', backgroundOpacity: 0, align: 'left', bold: false, italic: false, uppercase: false, border: false }
  const field = (id, size, height, bold = false) => ({ id, kind: 'field', zone: 'body', x: 0, y: 0, width: 343, height, style: { ...style, size, bold }, text: '', content: null, field: `product.${id}`, image: '', columns: [] })
  return { version: 1, orientation: 'portrait', pageSize: { width: 95, height: 28 }, margin: 2, headerHeight: 0, footerHeight: 0, headings: [style, style, style], blocks: [{ ...field('brand', 11, 16), width: 154 }, { ...field('reference', 11, 16), sameLine: true, x: 166, width: 177, style: { ...style, size: 11, align: 'right' } }, field('name', 9, 14), { ...field('barcode', 10, 47), kind: 'barcode', y: 3, style: { ...style, align: 'center' } }] }
}
