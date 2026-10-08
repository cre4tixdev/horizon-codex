// Sales owns the public quotation projection consumed by Documents.
module.exports = (app, user, id) => {
  if (!require(`${__hooks}/lib/activity.js`).allowed(app, user, false, 'sales')) throw new ForbiddenError('Accès au devis refusé.')
  if (!/^[a-z0-9]{15}$/.test(id || '')) throw new BadRequestError('Choisissez un devis pour l’aperçu.')
  const quote = app.findRecordById('sales_quotes', id)
  const company = app.findRecordById('contacts_companies', quote.getString('company'))
  const opportunity = app.findRecordById('crm_opportunities', quote.getString('opportunity'))
  const client = require(`${__hooks}/lib/contacts-document-context.js`)(app, company)
  const fields = client.fields
  for (const field of ['quote_number', 'title', 'quote_date', 'valid_until', 'currency', 'subtotal_before_discount', 'discount_amount', 'subtotal', 'tax_rate', 'tax', 'total', 'options_total', 'terms_label', 'terms_content']) fields[`quote.${field}`] = quote.get(field)
  const start = Date.parse(quote.getString('quote_date').slice(0, 10)), end = Date.parse(quote.getString('valid_until').slice(0, 10))
  fields['quote.validity_days'] = Number.isFinite(start) && Number.isFinite(end) ? Math.round((end - start) / 86400000) : ''
  fields['opportunity.title'] = opportunity.getString('title')
  fields['opportunity.number'] = opportunity.getString('opportunity_number')
  fields['owner.name'] = app.findRecordById('core_users', quote.getString('owner')).getString('name')
  if (quote.getString('contact')) {
    const contact = app.findRecordById('contacts_people', quote.getString('contact'))
    fields['contact.name'] = [contact.getString('first_name'), contact.getString('last_name')].filter(Boolean).join(' ')
    for (const key of ['email', 'phone']) fields[`contact.${key}`] = contact.getString(key)
  } else for (const key of ['name', 'email', 'phone']) fields[`contact.${key}`] = ''
  const columns = ['kind', 'description', 'brand', 'reference', 'quantity', 'unit', 'unit_price', 'discount', 'line_total', 'is_option', 'show_total', 'section_total', 'section_options_total']
  const lines = app.findRecordsByFilter('sales_quote_lines', 'quote = {:id}', 'position', 0, 0, { id }).map((line) => Object.fromEntries(columns.map((key) => [key, line.get(key)])))
  return { fields, lines, warnings: client.warnings }
}
