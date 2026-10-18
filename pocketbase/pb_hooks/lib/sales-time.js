// Sales owns validation and the minimal sold-service projection for time.
const c = require(`${__hooks}/lib/time-common.js`)
module.exports = {
  choices(app, account, product) {
    return c.all(app, 'sales_order_lines', 'order.analytic_child = {:account} && order.status = "confirmed" && product = {:product} && kind = "item"', { account, product }, 'position,id', 101).map((r) => ({ id: r.id, label: `${r.getString('description')} · ${r.getFloat('quantity')} ${r.getString('unit')}` }))
  },
  check(app, id, account, product) { if (id && !module.exports.choices(app, account, product).some((v) => v.id === id)) throw new BadRequestError('La ligne de commande doit correspondre au service et à l’imputation choisis.') },
}
