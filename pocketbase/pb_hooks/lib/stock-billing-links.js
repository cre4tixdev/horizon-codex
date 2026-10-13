module.exports = (app, user, orders, operationIds) => {
  if (!require(`${__hooks}/lib/access-policy.js`).permissions(app, user).includes('inventory.read') || !orders.length && !operationIds.length) return []
  const params = {}, filter = (operationIds.length ? operationIds : orders).map((id, index) => { params[`id${index}`] = id; return `${operationIds.length ? 'id' : 'sales_quote'} = {:id${index}}` }).join(' || ')
  return app.findRecordsByFilter('inventory_operations', `(${filter}) && kind = "OUT" && status != "cancelled" && scrap = false && internal_use = false`, 'created,id', 0, 0, params).map((record) => ({ id: record.id, label: record.getString('number'), reference: record.getString('status') === 'done' ? 'Livré' : 'En préparation', href: `/inventory/operations/${record.id}` }))
}
