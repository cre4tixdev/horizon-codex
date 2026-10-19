module.exports = {
  apply(app, user, source, target) {
    const rows = app.findRecordsByFilter('sales_quotes', 'company = {:source} && status = "draft" && sent_at = ""', 'id', 0, 0, { source })
    require(`${__hooks}/lib/company-merge-drafts.js`)(app, user, rows, 'company', target)
  },
}
