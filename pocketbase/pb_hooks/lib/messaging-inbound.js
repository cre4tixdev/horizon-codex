// Messaging owns reply correlation, persistent polling and immutable received files.
const c = require(`${__hooks}/lib/messaging-common.js`), oauth = require(`${__hooks}/lib/messaging-oauth.js`)
const reader = () => require(`${__hooks}/lib/mail-provider.js`).reader
const failure = (code, message) => Object.assign(new Error(message), { receiveCode: code })
const now = () => new Date().toISOString().replace('T', ' ')
const header = (m, name) => (m.internetMessageHeaders || []).filter((h) => String(h.name).toLowerCase() === name.toLowerCase()).map((h) => String(h.value || '')).join(' ')
const ids = (v) => (v.match(/<[^<>\s]{1,990}>/g) || []).slice(-30)
const address = (m) => String(m.from?.emailAddress?.address || '').toLowerCase()
const dedup = (box, id) => $security.sha256(box + '\n' + id)
const rootEntity = (message) => message.getString('source_context') === 'sales_quote' ? 'sales_quotes' : 'purchasing_orders'
const readEnabled = (app, box) => {
  const b = c.get(app, 'messaging_mailboxes', box), connection = oauth.checkConnection(app, box)
  if (!b.getBool('receive_enabled') || !c.json(connection, 'granted_scopes').includes('Mail.Read')) throw new Error('Activez la réception puis reconnectez la boîte avec Mail.Read.')
  return { box: b, generation: connection.getString('generation'), account: connection.getString('account_id') }
}
const decode = (value) => {
  if (typeof value !== 'string' || value.length > 2796204 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) throw failure('attachment_invalid', 'Pièce jointe Microsoft invalide.')
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/', bytes = []
  for (let i = 0; i < value.length; i += 4) {
    const n = (alphabet.indexOf(value[i]) << 18) | (alphabet.indexOf(value[i + 1]) << 12) | ((alphabet.indexOf(value[i + 2]) & 63) << 6) | (alphabet.indexOf(value[i + 3]) & 63)
    bytes.push((n >>> 16) & 255); if (value[i + 2] !== '=') bytes.push((n >>> 8) & 255); if (value[i + 3] !== '=') bytes.push(n & 255)
  }
  return bytes
}
// The nearest known Message-ID wins. Never attach by subject/conversation alone.
const belongs = (app, thread, m) => {
  const parent = ids(header(m, 'In-Reply-To'))
  // An explicit unknown parent is ambiguous: do not fall back to an older source.
  const references = (parent.length ? parent : ids(header(m, 'References'))).reverse()
  for (const id of references) {
    const roots = app.findRecordsByFilter('messaging_email_threads', 'mailbox = {:box} && internet_message_id = {:id}', '', 2, 0, { box: thread.getString('mailbox'), id })
    if (roots.length) return roots.length === 1 && roots[0].getString('message') === thread.getString('message')
    const replies = app.findRecordsByFilter('messaging_email_replies', 'dedup_key = {:key}', '', 1, 0, { key: dedup(thread.getString('mailbox'), id) })
    if (replies.length) return replies[0].getString('message') === thread.getString('message')
  }
  return false
}
const attachmentFiles = (app, ctx, m) => {
  const files = [], warnings = []; let total = 0
  if (!m.hasAttachments) return { files, warnings }
  ctx.stage = 'attachments'
  const page = reader().attachments(app, ctx.box.id, ctx.generation, m.id)
  if (!Array.isArray(page.value)) throw failure('attachment_list_invalid', 'Liste des pièces Microsoft invalide.')
  for (const a of page.value) {
    if (a.isInline) continue
    const name = String(a.name || 'Document').replace(/[\\/]/g, '_').split('').map((v) => v.charCodeAt(0) < 32 ? '_' : v).join('').slice(0, 180)
    if (files.length >= 10 || !['application/pdf', 'image/png', 'image/jpeg', 'image/webp'].includes(a.contentType) || !Number.isInteger(a.size) || a.size < 0 || total + a.size > 2097152 || a['@odata.type'] !== '#microsoft.graph.fileAttachment') { warnings.push(`${name} : pièce non importée (format ou taille). Consultez Outlook.`); continue }
    const data = reader().attachment(app, ctx.box.id, ctx.generation, m.id, a.id)
    const bytes = decode(data.contentBytes)
    if (total + bytes.length > 2097152) { warnings.push(`${name} : taille maximale dépassée. Consultez Outlook.`); continue }
    files.push($filesystem.fileFromBytes(bytes, name)); total += bytes.length
  }
  if (page['@odata.nextLink']) warnings.push('Autres pièces non importées : consultez Outlook.')
  return { files, warnings }
}
const importReply = (app, thread, ctx, item) => {
  if (item.isDraft || !c.content.email(address(item)) || address(item) === ctx.box.getString('address') || !/^<[^<>\s]{1,990}>$/.test(item.internetMessageId || '') || !belongs(app, thread, item)) return false
  const key = dedup(ctx.box.id, item.internetMessageId)
  if (app.findRecordsByFilter('messaging_email_replies', 'dedup_key = {:key}', '', 1, 0, { key }).length) return false
  ctx.stage = 'reply_content'
  const m = reader().message(app, ctx.box.id, ctx.generation, item.id)
  if (m.internetMessageId !== item.internetMessageId || address(m) !== address(item) || m.isDraft || String(m.body?.contentType).toLowerCase() !== 'text' || !Number.isFinite(Date.parse(m.receivedDateTime))) throw failure('reply_content_invalid', 'Réponse Microsoft incohérente ou corps texte indisponible.')
  const { files, warnings } = attachmentFiles(app, ctx, m), text = String(m.body.content || '')
  if (text.length > 30000) warnings.push('Message tronqué à 30 000 caractères. Consultez Outlook pour la suite.')
  ctx.stage = 'reply_save'
  let imported = false
  app.runInTransaction((tx) => {
    const current = c.get(tx, 'messaging_email_threads', thread.id), valid = readEnabled(tx, ctx.box.id)
    if (current.getString('claim') !== thread.getString('claim') || valid.generation !== ctx.generation) throw failure('reception_changed', 'Relève modifiée pendant la réception.')
    if (tx.findRecordsByFilter('messaging_email_replies', 'dedup_key = {:key}', '', 1, 0, { key }).length) return
    const message = c.get(tx, 'messaging_email_messages', thread.getString('message')), source = tx.findRecordById(rootEntity(message), message.getString('source_id'))
    const r = new Record(tx.findCollectionByNameOrId('messaging_email_replies'))
    for (const [k, v] of Object.entries({ message: message.id, mailbox: ctx.box.id, provider_id: m.id, internet_message_id: m.internetMessageId, dedup_key: key, sender_address: address(m), sender_name: String(m.from?.emailAddress?.name || '').slice(0, 255), subject: String(m.subject || '').slice(0, 500), received_at: m.receivedDateTime, body_text: text.slice(0, 30000), attachments: files, warnings })) r.set(k, v)
    tx.save(r)
    const activity = require(`${__hooks}/lib/activity.js`), event = activity.publish(tx, source, '', 'message', `Réponse reçue de ${address(m)}`, { email_reply_id: r.id })
    const owner = c.get(tx, 'core_users', message.getString('owner')), module = event.getString('source_module')
    if (activity.allowed(tx, owner, false, module)) activity.notification(tx, owner.id, event, `Réponse à ${message.getString('source_label') || 'votre e-mail'}`, `${address(m)} : ${String(m.subject || '').slice(0, 200)}`, 'email_replies')
    c.audit(tx, owner, r, 'reply_received'); imported = true
  })
  return imported
}
const track = (app, message) => {
  if (message.getString('status') !== 'sent' || message.getString('source_context') === 'generic' || app.findRecordsByFilter('messaging_email_threads', 'message = {:id}', '', 1, 0, { id: message.id }).length) return
  const r = new Record(app.findCollectionByNameOrId('messaging_email_threads')); r.set('message', message.id); r.set('mailbox', message.getString('mailbox')); r.set('phase', 'discovery'); r.set('next_attempt_at', now()); app.save(r)
}
const poll = (app, candidate) => {
  let thread, ctx
  app.runInTransaction((tx) => {
    const t = c.get(tx, 'messaging_email_threads', candidate.id)
    if (t.getString('claim') && Date.parse(t.getString('claimed_at')) > Date.now() - 600000 || Date.parse(t.getString('next_attempt_at')) > Date.now()) return
    ctx = readEnabled(tx, t.getString('mailbox'))
    if (t.getString('account_id') !== ctx.account) { t.set('account_id', ctx.account); t.set('internet_message_id', ''); t.set('conversation_id', ''); t.set('phase', 'discovery'); t.set('next_link', '') }
    t.set('claim', $security.randomString(40)); t.set('claimed_at', now()); tx.save(t); thread = t
  })
  if (!thread) return 0
  ctx.stage = thread.getString('phase') === 'discovery' ? 'sent_discovery' : 'conversation'
  let count = 0, error = '', delay = 120
  try {
    const message = c.get(app, 'messaging_email_messages', thread.getString('message'))
    if (message.getString('status') !== 'sent' || message.getString('from_address') !== ctx.box.getString('address')) throw failure('sender_changed', 'L’expéditeur d’origine ne correspond plus à cette boîte.')
    if (thread.getString('phase') === 'discovery') {
      const page = reader().discovery(app, ctx.box.id, ctx.generation, message, thread.getString('next_link'))
      if (!Array.isArray(page.value)) throw failure('message_list_invalid', 'Liste Microsoft invalide.')
      const matches = page.value.filter((m) => !m.isDraft && address(m) === message.getString('from_address') && header(m, 'X-Horizon-Message') === message.id)
      if (matches.length > 1) throw failure('sent_copy_ambiguous', 'Plusieurs copies de cet envoi existent : rattachement à vérifier dans Outlook.')
      if (matches.length === 1) {
        const m = matches[0]
        if (!/^<[^<>\s]{1,990}>$/.test(m.internetMessageId || '') || !m.conversationId || m.conversationId.length > 1000) throw failure('message_identity_invalid', 'Identifiants Microsoft invalides.')
        thread.set('internet_message_id', m.internetMessageId); thread.set('conversation_id', m.conversationId); thread.set('phase', 'conversation'); thread.set('next_link', ''); delay = 0
      } else {
        thread.set('next_link', page['@odata.nextLink'] || '')
        if (!page['@odata.nextLink']) throw failure('sent_copy_missing', 'Copie envoyée introuvable. Conservez-la dans les Éléments envoyés Outlook ; nouvelle recherche planifiée.')
        delay = 0
      }
    } else {
      const page = reader().conversation(app, ctx.box.id, ctx.generation, thread.getString('conversation_id'), thread.getString('next_link'))
      if (!Array.isArray(page.value)) throw failure('conversation_invalid', 'Conversation Microsoft invalide.')
      for (const m of page.value) { ctx.stage = 'conversation'; if (importReply(app, thread, ctx, m)) count++ }
      thread.set('next_link', page['@odata.nextLink'] || '')
      if (page['@odata.nextLink']) delay = 0
      else thread.set('last_sync_at', now())
    }
  } catch (e) {
    if (e.invalidCursor) thread.set('next_link', '')
    const stages = { sent_discovery: 'Recherche de l’envoi d’origine interrompue.', conversation: 'Lecture de la conversation interrompue.', reply_content: 'Lecture du contenu de la réponse interrompue.', attachments: 'Lecture des pièces jointes de la réponse interrompue.', reply_save: 'Enregistrement de la réponse interrompu.' }
    error = e.receiveCode ? e.message : `${stages[ctx.stage] || 'Réception interrompue'} Nouvelle tentative automatique. Consultez le diagnostic serveur si cela persiste.`
    delay = Math.min(604800, Math.max(120, Number(e.delay) || 120))
    // Do not log the raw exception, Graph response, URL, token or mail contents.
    app.logger().warn('Messaging reply polling interrupted', 'thread_id', thread.id, 'stage', ctx.stage, 'code', e.receiveCode || 'internal_error', 'http_status', e.httpStatus || 0, 'request_id', e.requestId || '', 'exception', ['TypeError', 'RangeError', 'ReferenceError', 'SyntaxError'].includes(e.name) ? e.name : 'Error')
  }
  app.runInTransaction((tx) => {
    const current = c.get(tx, 'messaging_email_threads', thread.id)
    if (current.getString('claim') !== thread.getString('claim')) return
    for (const key of ['internet_message_id', 'conversation_id', 'phase', 'next_link', 'last_sync_at']) current.set(key, thread.getString(key))
    current.set('last_error', error); current.set('claim', ''); current.set('claimed_at', ''); current.set('next_attempt_at', new Date(Date.now() + delay * 1000).toISOString()); tx.save(current)
  })
  return count
}
module.exports = {
  track,
  summary(app, box) {
    const latest = app.findRecordsByFilter('messaging_email_threads', 'mailbox = {:box} && last_sync_at != ""', '-last_sync_at', 1, 0, { box })[0]
    const error = app.findRecordsByFilter('messaging_email_threads', 'mailbox = {:box} && last_error != ""', '-updated', 1, 0, { box })[0]
    return { last_sync_at: latest?.getString('last_sync_at') || '', error: error?.getString('last_error') || '' }
  },
  process(app, mailbox = '') {
    let received = 0
    // Bounded fair queue: due pages resume after crashes; one page per thread/pass.
    const params = { now: now(), stale: new Date(Date.now() - 600000).toISOString().replace('T', ' ') }
    const boxes = mailbox ? [c.get(app, 'messaging_mailboxes', mailbox)] : app.findRecordsByFilter('messaging_mailboxes', 'active = true && receive_enabled = true', 'id', 1000, 0)
    const eligible = boxes.filter((box) => { try { readEnabled(app, box.id); return true } catch { return false } })
    if (!eligible.length) return 0
    const filter = eligible.map((box, i) => { params['box' + i] = box.id; return `mailbox = {:box${i}}` }).join(' || ')
    const threads = app.findRecordsByFilter('messaging_email_threads', 'next_attempt_at <= {:now} && (claim = "" || claimed_at <= {:stale}) && mailbox.receive_enabled = true && mailbox.active = true' + ` && (${filter})`, 'next_attempt_at,created,id', 20, 0, params)
    for (const t of threads) {
      try { received += poll(app, t) } catch { app.logger().warn('Messaging reply polling unavailable', 'thread_id', t.id) }
    }
    return received
  },
  sync(e) {
    c.guard(e.app, e.auth, 'settings'); const b = e.requestInfo().body; c.exact(b, ['mailbox']); readEnabled(e.app, b.mailbox)
    return e.json(200, { received: this.process(e.app, b.mailbox) })
  },
}
