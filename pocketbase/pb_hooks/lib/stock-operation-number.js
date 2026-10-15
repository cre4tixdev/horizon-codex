// Display only: never reserve a sequence number for an unvalidated operation.
module.exports = (app, record) => record.getString('number') || `${app.findRecordById('inventory_warehouses', record.getString('warehouse')).getString('code')}/${record.getString('kind')}/-----`
