/* global __hooks */
migrate((app) => {
  const operations = require(`${__hooks}/lib/stock-operations.js`)
  for (const order of app.findAllRecords('purchasing_orders')) {
    const actor = order.getString('validated_by') || order.getString('created_by')
    if (!actor) continue
    operations.syncPurchase(app, app.findRecordById('core_users', actor), order)
  }
}, () => { throw new Error('Restore a coherent backup: expected receipts and purchase orders must remain linked.') })
