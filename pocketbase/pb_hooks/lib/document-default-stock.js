module.exports = (context) => {
  const receipt = Boolean(context?.fields['stock.purchase_number'])
  const layout = require(`${__hooks}/lib/document-default-purchase.js`)()
  layout.blocks = layout.blocks.filter((block) => !['supplier', 'address', 'total-label', 'total-ht', 'tax-label', 'tax', 'ttc-label', 'ttc'].includes(block.id)).map((block) => {
    if (block.id === 'title') return { ...block, kind: 'field', field: 'stock.label', text: '' }
    if (block.id === 'number') return { ...block, field: 'stock.number' }
    if (block.id === 'date') return { ...block, field: 'stock.document_date' }
    if (block.id === 'lines') return { ...block, field: 'stock.number', tableSource: 'inventory.operation_lines', columns: receipt ? [{ field: 'description', label: 'Description', width: 28 }, { field: 'brand', label: 'Marque', width: 12 }, { field: 'reference', label: 'Référence', width: 15 }, { field: 'quantity', label: 'Qté', width: 7 }, { field: 'unit', label: 'u.', width: 4 }, { field: 'affairs', label: 'Affaires', width: 18 }, { field: 'destination', label: 'Destination', width: 16 }] : [{ field: 'description', label: 'Description', width: 48 }, { field: 'brand', label: 'Marque', width: 16 }, { field: 'reference', label: 'Référence', width: 20 }, { field: 'quantity', label: 'Qté', width: 10 }, { field: 'unit', label: 'u.', width: 6 }] }
    if (block.id === 'pages') return { ...block, field: 'stock.number' }
    return block
  })
  const base = layout.blocks[1]
  layout.blocks.splice(3, 0, { ...base, id: 'warehouse', field: 'stock.warehouse' }, { ...base, id: 'destination', field: 'stock.destination' }, { ...base, id: 'state', field: 'stock.state' })
  if (receipt) { layout.blocks = layout.blocks.filter((block) => !['destination', 'analytic'].includes(block.id)); layout.blocks.splice(3, 0, { ...base, id: 'sender', field: 'stock.supplier_name', text: 'Expéditeur : ', style: { ...base.style, bold: true } }, { ...base, id: 'sender-address', field: 'stock.supplier_address', height: 48 }, { ...base, id: 'source-order', field: 'stock.purchase_number', text: 'Commande fournisseur : ' }) }
  return layout
}
