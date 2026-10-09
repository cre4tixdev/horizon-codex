const round = (value) => Math.round((value + Number.EPSILON) * 1000000) / 1000000
module.exports = {
  marginRate(cost, price) {
    if (![cost, price].every((value) => typeof value === 'number' && Number.isFinite(value)) || cost < 0 || price < 0) throw new BadRequestError('Coût ou prix invalide.')
    return price > 0 ? round((price - cost) / price * 100) : null
  },
  offer(input) {
    const list = input.list_price, discount = input.discount, quantity = input.purchase_quantity
    if (![list, discount, quantity].every((value) => typeof value === 'number' && Number.isFinite(value)) || list < 0 || list > 1000000000 || discount < 0 || discount > 100 || quantity < 0.000001 || quantity > 1000000) throw new BadRequestError('Prix, remise ou conditionnement fournisseur invalide.')
    const net = round(list * (1 - discount / 100)), cost = round(net / quantity)
    if (cost > 1000000000) throw new BadRequestError('Le coût unitaire dépasse la limite autorisée.')
    return { purchase_price: net, unit_cost: cost }
  },
  sale(cost, coefficient) {
    if (![cost, coefficient].every((value) => typeof value === 'number' && Number.isFinite(value)) || cost < 0 || cost > 1000000000 || coefficient < 0.000001 || coefficient > 100) throw new BadRequestError('Coût ou coefficient invalide.')
    const price = round(cost * coefficient)
    if (price > 1000000000) throw new BadRequestError('Le prix de vente dépasse la limite autorisée.')
    return price
  },
}
