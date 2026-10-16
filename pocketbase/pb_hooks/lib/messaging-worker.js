const c = require(`${__hooks}/lib/messaging-common.js`)
module.exports = (app, messageId = '') => {
  const now = new Date().toISOString().replace('T', ' '), stale = new Date(Date.now() - 10 * 60000).toISOString().replace('T', ' ')
  if (!messageId) app.runInTransaction((tx) => {
    for (const j of tx.findRecordsByFilter('messaging_outbox', 'status = "processing" && claimed_at < {:stale}', '', 20, 0, { stale })) {
      const r = c.get(tx, 'messaging_email_messages', j.getString('message')); r.set('status', 'uncertain'); r.set('error', 'Traitement interrompu. Vérifiez les éléments envoyés dans Microsoft 365.'); tx.save(r); j.set('status', 'uncertain'); j.set('last_error', r.getString('error')); tx.save(j)
    }
  })
  const candidates = app.findRecordsByFilter('messaging_outbox', 'status = "pending" && next_attempt_at <= {:now}' + (messageId ? ' && message = {:message}' : ''), 'created,id', messageId ? 1 : 5, 0, { now, message: messageId })
  for (const candidate of candidates) {
    let job, message, user
    app.runInTransaction((tx) => {
      const j = c.get(tx, 'messaging_outbox', candidate.id), r = c.get(tx, 'messaging_email_messages', j.getString('message'))
      if (j.getString('status') !== 'pending' || r.getString('status') !== 'pending' || j.getString('next_attempt_at') > new Date().toISOString().replace('T', ' ')) return
      j.set('status', 'processing'); j.set('claimed_at', now); j.set('attempts', j.getInt('attempts') + 1); tx.save(j); r.set('status', 'processing'); tx.save(r); job = j; message = r
    })
    if (!job) continue
    let transport = false
    try {
      user = c.get(app, 'core_users', message.getString('owner')); c.guard(app, user, 'send'); if (c.mailbox(app, user, message.getString('mailbox')).getString('address') !== message.getString('from_address')) throw new Error('L’adresse d’expédition a changé. Actualisez le brouillon.')
      const s = c.source(app, user, message.getString('source_context'), message.getString('source_id')); if (s.version !== message.getString('source_version')) throw new Error('La pièce a changé avant le traitement. Actualisez le brouillon.')
      c.filesSize(app, message, Array.from(message.getStringSlice('attachments')))
      transport = true; const receipt = require(`${__hooks}/lib/mail-provider.js`).send(app, message, job)
      app.runInTransaction((tx) => {
        const r = c.get(tx, 'messaging_email_messages', message.id), j = c.get(tx, 'messaging_outbox', job.id)
        r.set('status', 'sent'); r.set('sent_at', new Date().toISOString()); r.set('provider_request_id', receipt.requestId); r.set('error', ''); tx.save(r)
        if (r.getString('source_context') !== 'generic') require(`${__hooks}/lib/${r.getString('source_context') === 'sales_quote' ? 'sales' : 'purchasing'}-mail.js`).sent(tx, user, r.getString('source_id'), r)
        require(`${__hooks}/lib/messaging-inbound.js`).track(tx, r)
        j.set('status', 'complete'); tx.save(j); c.audit(tx, user, r, 'provider_accepted')
      })
    } catch (error) {
      const uncertain = transport && error.uncertain !== false, retry = !uncertain && error.retry === true && (error.delay || 60) <= 604800 && job.getInt('attempts') < 5, label = uncertain ? 'Réponse Microsoft ou traitement incertain. Vérifiez les éléments envoyés avant tout nouvel envoi.' : transport ? String(error.message || 'Envoi refusé.').slice(0, 900) : 'Envoi interrompu avant transmission. Vérifiez vos droits, l’expéditeur, la pièce source et les pièces jointes.'
      app.logger().error('Messaging outbox failed', 'message_id', message.id, 'uncertain', uncertain, 'retry', retry)
      app.runInTransaction((tx) => { const r = c.get(tx, 'messaging_email_messages', message.id), j = c.get(tx, 'messaging_outbox', job.id); if (r.getString('status') === 'sent') return; r.set('status', uncertain ? 'uncertain' : retry ? 'pending' : 'failed'); r.set('error', label); tx.save(r); j.set('status', uncertain ? 'uncertain' : retry ? 'pending' : 'failed'); if (retry) j.set('next_attempt_at', new Date(Date.now() + Math.max(error.delay || 60, 60 * 2 ** (job.getInt('attempts') - 1)) * 1000).toISOString()); j.set('last_error', label); tx.save(j) })
    }
  }
  return candidates.length
}
