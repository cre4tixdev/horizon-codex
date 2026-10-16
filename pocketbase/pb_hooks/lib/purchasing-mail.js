// Public Purchasing contract for Messaging. No direct writes from Messaging.
module.exports = {
  source(app, u, id) {
    const c = require(`${__hooks}/lib/purchasing-common.js`); c.guard(app, u, 'write'); const r = c.get(app, 'purchasing_orders', id)
    if (r.getString('archived_at') || !['validated', 'sent', 'acknowledged', 'partially_received', 'received', 'closed'].includes(r.getString('status'))) throw new BadRequestError('Validez et réactivez le BC avant de préparer un e-mail.')
    const f = require(`${__hooks}/lib/purchasing-document-context.js`)(app, u, id).fields
    return { version: r.getString('updated'), label: f['purchase.number'], pdf: { purchase_order_id: id }, fields: { 'contact.prenom': '', 'contact.nom': '', 'societe.nom': f['company.name'], 'affaire.titre': f['opportunity.title'], 'affaire.code': f['opportunity.number'], 'piece.numero': f['purchase.number'], 'piece.titre': f['purchase.title'], 'piece.montant': String(f['purchase.total']), 'piece.devise': f['purchase.currency'] }, to: [f['company.email']].filter(Boolean) }
  },
  sent(app, u, id, message) {
    const r = app.findRecordById('purchasing_orders', id), before = r.publicExport()
    if (r.getString('status') === 'validated') r.set('status', 'sent')
    r.set('sent_at', r.getString('sent_at') || new Date().toISOString()); app.save(r)
    require(`${__hooks}/lib/purchasing.js`).refreshRequests(app, r)
    require(`${__hooks}/lib/access-policy.js`).audit(app, 'purchasing_orders', id, u.id, before, r.publicExport(), 'email_sent')
    require(`${__hooks}/lib/activity.js`).publish(app, r, u.id, 'change', `Commande envoyée à ${JSON.parse(message.getString('to') || '[]').join('; ')}`, { email_id: message.id })
  },
}
