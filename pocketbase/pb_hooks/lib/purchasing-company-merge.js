module.exports = {
  apply(app, user, source, target) {
    const orders = app.findRecordsByFilter('purchasing_orders', 'supplier = {:source} && status = "draft" && sent_at = "" && document_snapshot = null', 'id', 0, 0, { source })
    require(`${__hooks}/lib/company-merge-drafts.js`)(app, user, orders, 'supplier', target)
    const lines = app.findRecordsByFilter('purchasing_request_lines', 'suggested_supplier = {:source} && request.status = "draft"', 'id', 0, 0, { source })
    require(`${__hooks}/lib/company-merge-drafts.js`)(app, user, lines, 'suggested_supplier', target)
  },
}
