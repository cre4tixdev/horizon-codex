const keys = ['kit_key', 'kit_parent', 'kit_quantity', 'kit_print_details']
const rounded = (value) => Math.round(value * 1e6) / 1e6
// One commercial row, persistent operational component rows; quantities stay canonical everywhere.
const prepare = (input) => {
  if (!Array.isArray(input)) return input
  const rows = input.map((line) => ({ ...line })), parents = new Map()
  for (const [index, line] of rows.entries()) {
    for (const key of ['kit_key', 'kit_parent']) if (line[key] !== undefined && (typeof line[key] !== 'string' || line[key] && !/^[a-zA-Z0-9-]{16,64}$/.test(line[key]))) throw new BadRequestError('Groupe de kit invalide.')
    if (line.kit_print_details !== undefined && typeof line.kit_print_details !== 'boolean') throw new BadRequestError('Présentation du kit invalide.')
    if (line.kit_key) {
      if (line.kit_parent || parents.has(line.kit_key) || line.kind && line.kind !== 'item' || !line.product) throw new BadRequestError('Kit imbriqué ou groupe répété interdit.')
      parents.set(line.kit_key, { line, index, children: [] })
    }
  }
  for (const [index, line] of rows.entries()) if (line.kit_parent) {
    const parent = parents.get(line.kit_parent)
    if (!parent || index <= parent.index || line.kind && line.kind !== 'item' || !line.product || typeof line.kit_quantity !== 'number' || !Number.isFinite(line.kit_quantity) || line.kit_quantity < 0.000001 || line.kit_quantity > 1000000) throw new BadRequestError('Composant ou quantité par kit invalide.')
    if (rows.slice(parent.index + 1, index).some((row) => row.kit_parent !== line.kit_parent)) throw new BadRequestError('Les composants doivent rester sous leur kit.')
    parent.children.push(line)
    line.quantity = rounded(Number(parent.line.quantity) * line.kit_quantity)
    if (!Number.isFinite(line.quantity) || line.quantity > 1000000) throw new BadRequestError('Quantité totale de composants hors limites.')
    line.unit_price = 0; line.price_source = 'manual'; line.margin_percent = 0; line.discount = 0; line.is_option = Boolean(parent.line.is_option); line.show_total = false
  }
  for (const { line, children } of parents.values()) {
    if (!children.length || children.length > 50) throw new BadRequestError('Un kit doit contenir de 1 à 50 composants.')
    line.unit_cost = rounded(children.reduce((sum, child) => sum + child.kit_quantity * Number(child.unit_cost || 0), 0))
    if (!Number.isFinite(line.unit_cost) || line.unit_cost > 1000000000) throw new BadRequestError('Coût du kit hors limites.')
  }
  return rows
}
module.exports = { keys, prepare }
