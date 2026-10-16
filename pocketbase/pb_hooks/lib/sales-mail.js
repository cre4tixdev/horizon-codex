// Public Sales contract for Messaging. Sales owns its status and client projection.
module.exports = {
  source(app, u, id) {
    if (!require(`${__hooks}/lib/activity.js`).allowed(app, u, true, 'sales')) throw new ForbiddenError('Envoi du devis non autorisé.')
    const r = app.findRecordById('sales_quotes', id)
    if (r.getString('archived_at') || !['validated', 'sent'].includes(r.getString('status'))) throw new BadRequestError('Finalisez et réactivez le devis avant de préparer un e-mail.')
    const c = require(`${__hooks}/lib/sales-document-context.js`)(app, u, id), f = c.fields
    const person = r.getString('contact') ? app.findRecordById('contacts_people', r.getString('contact')) : null
    return { version: r.getString('updated'), label: f['quote.quote_number'], pdf: { quote_id: id }, fields: { 'contact.prenom': person?.getString('first_name') || '', 'contact.nom': f['contact.name'], 'societe.nom': f['company.name'], 'affaire.titre': f['opportunity.title'], 'affaire.code': f['opportunity.number'], 'piece.numero': f['quote.quote_number'], 'piece.titre': f['quote.title'], 'piece.montant': String(f['quote.total']), 'piece.devise': f['quote.currency'] }, to: [f['contact.email'] || f['company.email']].filter(Boolean) }
  },
  sent(app, u, id, message) {
    const r = app.findRecordById('sales_quotes', id), before = r.publicExport()
    if (r.getString('status') === 'validated') r.set('status', 'sent')
    r.set('sent_at', r.getString('sent_at') || new Date().toISOString()); app.save(r)
    require(`${__hooks}/lib/access-policy.js`).audit(app, 'sales_quotes', id, u.id, before, r.publicExport(), 'email_sent')
    require(`${__hooks}/lib/activity.js`).publish(app, r, u.id, 'change', `Devis envoyé à ${JSON.parse(message.getString('to') || '[]').join('; ')}`, { email_id: message.id })
  },
}
