const c = require(`${__hooks}/lib/messaging-common.js`), table = 'messaging_email_messages'
const blank = () => ({ type: 'doc', content: [] })
const pdf = (app, u, context, id, template) => { const s = c.source(app, u, context, id); if (!s.pdf) return null; const d = require(`${__hooks}/lib/documents.js`).prepare(app, u, { ...s.pdf, template_id: template, format: 'pdf' }); return { file: $filesystem.fileFromBytes(require(`${__hooks}/lib/gotenberg.js`).convert(app, d.layout, d.rendered), d.filename), filename: d.filename } }
module.exports = {
  choices(e) {
    c.guard(e.app, e.auth); const app = e.app, u = e.auth, q = e.request.url.query(), prior = q.get('message') ? c.own(app, u, q.get('message')) : null, context = prior?.getString('source_context') || q.get('context') || 'generic', id = prior?.getString('source_id') || q.get('source') || ''
    let available = true, s = prior ? { version: prior.getString('source_version'), label: prior.getString('source_label'), to: c.json(prior, 'to'), fields: {} } : c.source(app, u, context, id)
    if (prior && prior.getString('status') === 'draft') { try { s = c.source(app, u, context, id) } catch { available = false; app.logger().warn('Messaging source unavailable', 'message_id', prior.id) } }
    const boxes = c.all(app, 'messaging_mailboxes', 'active = true').filter((r) => Array.from(r.getStringSlice('allowed_users')).includes(u.id)).map((r) => r.publicExport())
    const values = { ...s.fields, 'utilisateur.nom': u.getString('name'), 'expediteur.adresse': boxes[0]?.address || '' }
    return e.json(200, { source_available: available, source: { context, id, version: s.version, label: s.label, to: s.to }, variables: c.content.variables, values, mailboxes: boxes.map((b) => ({ ...b, connection: require(`${__hooks}/lib/messaging-oauth.js`).summary(app, b.id) })), templates: c.all(app, 'messaging_email_templates', 'active = true && context = {:context}', { context }, 'name,id').map((r) => r.publicExport()), signatures: c.all(app, 'messaging_email_signatures', 'active = true && (user = "" || user = {:user})', { user: u.id }, 'name,id').map((r) => r.publicExport()), pdf_templates: context === 'generic' ? [] : c.all(app, 'documents_templates', 'status != "archived" && current_version != "" && document_type = {:type}', { type: context === 'sales_quote' ? 'quote' : 'purchase_order' }, 'name,id').map((r) => ({ id: r.id, name: r.getString('name') })), configured: require(`${__hooks}/lib/mail-provider.js`).configured(), can_send: c.can(app, u, 'send'), can_write: c.can(app, u, 'write'), can_settings: c.can(app, u, 'settings') })
  },
  render(e) {
    c.guard(e.app, e.auth); const b = e.requestInfo().body; c.exact(b, ['context', 'source', 'template', 'mailbox', 'signature'])
    const s = c.source(e.app, e.auth, b.context, b.source || ''), box = c.mailbox(e.app, e.auth, b.mailbox), t = b.template ? c.get(e.app, 'messaging_email_templates', b.template) : null
    if (t && (!t.getBool('active') || t.getString('context') !== b.context)) throw new BadRequestError('Modèle incompatible.')
    const values = { ...s.fields, 'utilisateur.nom': e.auth.getString('name'), 'expediteur.adresse': box.getString('address') }
    const body = t ? c.content.resolve(c.json(t, 'body_json', blank()), values) : blank()
    let signature = blank()
    if (b.signature) { const r = c.get(e.app, 'messaging_email_signatures', b.signature); if (!r.getBool('active') || r.getString('user') && r.getString('user') !== e.auth.id) throw new ForbiddenError('Signature non autorisée.'); signature = c.content.resolve(c.json(r, 'body_json', blank()), values) }
    return e.json(200, { subject: t ? c.content.replace(t.getString('subject'), values) : '', body_json: body, signature_snapshot: signature })
  },
  preview(e) {
    c.guard(e.app, e.auth); const b = e.requestInfo().body; c.exact(b, ['context', 'source', 'pdf_template']); const s = c.source(e.app, e.auth, b.context, b.source)
    if (!s.pdf) throw new BadRequestError('Aucune pièce PDF pour ce message.')
    const d = require(`${__hooks}/lib/documents.js`).prepare(e.app, e.auth, { ...s.pdf, template_id: b.pdf_template, format: 'pdf' })
    return require(`${__hooks}/lib/gotenberg.js`)(e, d.layout, d.rendered, d.filename)
  },
  record(e) { return e.json(200, c.dto(c.own(e.app, e.auth, e.request.pathValue('id')))) },
  list(e) {
    c.guard(e.app, e.auth); const q = e.request.url.query(), allowed = ['draft', 'pending', 'processing', 'sent', 'failed', 'uncertain', 'cancelled'], selected = (q.get('status') || '').split(',').filter(Boolean)
    if (selected.some((s) => !allowed.includes(s))) throw new BadRequestError('État invalide.')
    const fields = { Objet: 'subject', Expéditeur: 'from_address', État: 'status', Date: 'created', Pièce: 'source_label' }, raw = q.get('sort') || '-created', sort = raw.replace(/^-/, ''); if (!Object.values(fields).includes(sort)) throw new BadRequestError('Tri invalide.')
    const page = Math.max(1, Math.min(10000, Math.trunc(Number(q.get('page'))) || 1)), search = (q.get('q') || '').slice(0, 200), params = { user: e.auth.id, search, context: q.get('context') || '', source: q.get('source') || '' }
    const filter = 'owner = {:user}' + (q.get('state') === 'archived' ? ' && archived_at != ""' : ' && archived_at = ""') + (selected.length ? ' && (' + selected.map((v) => `status = "${v}"`).join(' || ') + ')' : '') + (search ? ' && (subject ~ {:search} || source_label ~ {:search} || from_address ~ {:search} || to ~ {:search})' : '') + (params.context ? ' && source_context = {:context}' : '') + (params.source ? ' && source_id = {:source}' : '')
    const conditions = [$dbx.hashExp({ owner: e.auth.id }), $dbx.exp(q.get('state') === 'archived' ? "archived_at != ''" : "archived_at = ''")]; if (selected.length) conditions.push($dbx.in('status', ...selected)); if (params.context) conditions.push($dbx.hashExp({ source_context: params.context })); if (params.source) conditions.push($dbx.hashExp({ source_id: params.source })); if (search) conditions.push($dbx.or(...['subject', 'source_label', 'from_address', 'to'].map((key) => $dbx.like(key, search))))
    const total = e.app.countRecords(table, $dbx.and(...conditions)), rows = e.app.findRecordsByFilter(table, filter, `${raw},id`, 30, (page - 1) * 30, params)
    return e.json(200, { items: rows.map(c.dto), totalItems: total, page, totalPages: Math.max(1, Math.ceil(total / 30)) })
  },
  save(e) {
    c.guard(e.app, e.auth, 'write'); const b = e.requestInfo().body; c.exact(b, ['id', 'updated', 'creation_key', 'input', 'removed'])
    const input = typeof b.input === 'string' ? JSON.parse(b.input) : b.input, removed = typeof b.removed === 'string' ? JSON.parse(b.removed) : b.removed || []
    c.exact(input, ['mailbox', 'context', 'source', 'source_version', 'subject', 'to', 'cc', 'bcc', 'body_json', 'signature_snapshot', 'pdf_template'])
    if (typeof input.subject !== 'string' || input.subject.length > 500 || /[\r\n]/.test(input.subject)) throw new BadRequestError('Objet invalide.')
    const to = c.content.recipients(input.to), cc = c.content.recipients(input.cc), bcc = c.content.recipients(input.bcc); if (to.length + cc.length + bcc.length > 50) throw new BadRequestError('50 destinataires maximum.')
    c.content.render(input.body_json); c.content.render(input.signature_snapshot || blank())
    let uploads = []; if (String(e.request.header.get('Content-Type')).startsWith('multipart/form-data')) { try { uploads = e.findUploadedFiles('attachments') } catch (err) { if (!String(err).includes('no such file')) throw err } }
    const s = c.source(e.app, e.auth, input.context, input.source || ''); if (s.version !== input.source_version) throw new ApiError(409, 'La pièce a changé. Fermez puis rouvrez le compositeur pour actualiser le PDF.')
    c.mailbox(e.app, e.auth, input.mailbox); const generated = pdf(e.app, e.auth, input.context, input.source, input.pdf_template)
    const hash = $security.sha256(c.stable([input, to, cc, bcc])), key = String(b.creation_key || '')
    if (!b.id && !/^[a-zA-Z0-9-]{15,100}$/.test(key)) throw new BadRequestError('Clé de création invalide.')
    let saved
    e.app.runInTransaction((app) => {
      const u = c.get(app, 'core_users', e.auth.id); c.guard(app, u, 'write'); const box = c.mailbox(app, u, input.mailbox)
      if (c.source(app, u, input.context, input.source || '').version !== s.version) throw new ApiError(409, 'La pièce a changé pendant la préparation du PDF.')
      const duplicate = b.id ? null : app.findRecordsByFilter(table, 'creation_key = {:key}', '', 1, 0, { key })[0]
      if (duplicate) { if (duplicate.getString('owner') !== u.id || duplicate.getString('creation_hash') !== hash || uploads.length) throw new ApiError(409, 'Ce brouillon existe déjà. Ouvrez-le depuis Messagerie.'); saved = duplicate; return }
      const r = b.id ? c.own(app, u, b.id) : new Record(app.findCollectionByNameOrId(table))
      if (b.id) { c.version(r, b.updated); if (r.getString('archived_at') || r.getString('status') !== 'draft') throw new BadRequestError('Seul un brouillon peut être modifié.'); if (r.getString('source_context') !== input.context || r.getString('source_id') !== (input.source || '')) throw new BadRequestError('La source ne peut pas être remplacée.') }
      const names = Array.from(r.getStringSlice('attachments')); if (!Array.isArray(removed) || removed.some((n) => !names.includes(n) || n === r.getString('pdf_file'))) throw new BadRequestError('Pièces jointes à retirer invalides.')
      const retained = names.filter((n) => !removed.includes(n) && n !== r.getString('pdf_file'))
      const size = (retained.length ? c.filesSize(app, r, retained) : 0) + uploads.reduce((n, f) => n + f.size, 0) + (generated?.file.size || 0)
      if (size > 2097152 || retained.length + uploads.length + (generated ? 1 : 0) > 10) throw new BadRequestError('10 fichiers maximum et 2 Mo de pièces jointes au total, PDF inclus.')
      const signature = input.signature_snapshot || blank(), combined = { type: 'doc', content: [...(input.body_json.content || []), ...(signature.content || [])] }, rendered = c.content.render(combined)
      for (const [k, v] of Object.entries({ owner: u.id, mailbox: box.id, from_address: box.getString('address'), to, cc, bcc, subject: input.subject.trim(), body_json: input.body_json, signature_snapshot: signature, ...rendered, status: 'draft', source_context: input.context, source_id: input.source || '', source_version: s.version, source_label: s.label, pdf_template: input.pdf_template || '', error: '', attachments: [...retained, ...uploads, ...(generated ? [generated.file] : [])] })) r.set(k, v)
      if (!b.id) { r.set('creation_key', key); r.set('creation_hash', hash) }
      app.save(r); r.set('pdf_file', generated ? Array.from(r.getStringSlice('attachments')).at(-1) : ''); app.save(r); c.audit(app, u, r, 'save_draft'); saved = r
    }); return e.json(200, c.dto(saved))
  },
  transition(e) {
    const b = e.requestInfo().body; c.exact(b, ['updated', 'action', 'reason']); let saved, queued = false
    e.app.runInTransaction((app) => {
      const u = c.get(app, 'core_users', e.auth.id); c.guard(app, u, ['enqueue', 'resolve'].includes(b.action) ? 'send' : 'write'); const r = c.own(app, u, e.request.pathValue('id'))
      if (r.getString('archived_at') && b.action !== 'restore') throw new BadRequestError('Réactivez cet e-mail avant toute action.')
      if (b.action === 'enqueue' && ['pending', 'processing', 'sent'].includes(r.getString('status'))) { saved = r; return }
      c.version(r, b.updated)
      if (b.action === 'enqueue') {
        if (!['draft', 'failed'].includes(r.getString('status'))) throw new BadRequestError('Envoi non disponible pour cet état.')
        if (!require(`${__hooks}/lib/mail-provider.js`).configured()) throw new ApiError(503, 'Configurez Microsoft 365 avant d’envoyer.')
        if (c.mailbox(app, u, r.getString('mailbox')).getString('address') !== r.getString('from_address')) throw new BadRequestError('L’adresse d’expédition a changé. Enregistrez à nouveau le brouillon.'); const s = c.source(app, u, r.getString('source_context'), r.getString('source_id'))
        if (s.version !== r.getString('source_version')) throw new ApiError(409, 'La pièce a changé. Corrigez le brouillon pour actualiser son PDF avant envoi.')
        if (!r.getString('subject') || !c.json(r, 'to').length || !r.getString('text')) throw new BadRequestError('Renseignez destinataire, objet et message avant envoi.')
        if (s.pdf && (!r.getString('pdf_file') || !Array.from(r.getStringSlice('attachments')).includes(r.getString('pdf_file')))) throw new BadRequestError('Le PDF officiel doit être joint.')
        if (/\{\{[^{}]+\}\}/.test(r.getString('subject') + r.getString('text'))) throw new BadRequestError('Remplacez les variables non résolues avant envoi.')
        if (r.getString('source_id') && app.findRecordsByFilter(table, 'id != {:id} && source_context = {:context} && source_id = {:source} && (status = "pending" || status = "processing" || (status = "uncertain" && resolved_at = ""))', '', 1, 0, { id: r.id, context: r.getString('source_context'), source: r.getString('source_id') }).length) throw new BadRequestError('Un envoi est déjà en cours ou à vérifier pour cette pièce.')
        const prior = app.findRecordsByFilter('messaging_outbox', 'message = {:id}', '', 1, 0, { id: r.id })[0], job = prior || new Record(app.findCollectionByNameOrId('messaging_outbox'))
        job.set('transport_version', 'graph-delegated-v1'); job.set('connection_generation', require(`${__hooks}/lib/messaging-oauth.js`).checkConnection(app, r.getString('mailbox')).getString('generation')); job.set('attempts', 0); job.set('message', r.id); job.set('status', 'pending'); job.set('next_attempt_at', new Date().toISOString()); job.set('last_error', ''); app.save(job)
        r.set('status', 'pending'); r.set('queued_at', new Date().toISOString()); r.set('error', ''); queued = true
      } else if (b.action === 'resolve' && r.getString('status') === 'uncertain' && !r.getString('resolved_at')) {
        if (typeof b.reason !== 'string' || b.reason.trim().length < 10 || b.reason.length > 2000) throw new BadRequestError('Décrivez la vérification effectuée dans Microsoft 365 (10 caractères minimum).')
        r.set('resolved_at', new Date().toISOString()); r.set('resolution_note', b.reason.trim())
      } else if (b.action === 'reopen' && r.getString('status') === 'failed') { r.set('status', 'draft'); r.set('error', '') }
      else if (b.action === 'cancel' && ['draft', 'pending'].includes(r.getString('status'))) { r.set('status', 'cancelled'); for (const j of app.findRecordsByFilter('messaging_outbox', 'message = {:id}', '', 1, 0, { id: r.id })) { j.set('status', 'cancelled'); app.save(j) } }
      else if (['archive', 'restore'].includes(b.action) && !['pending', 'processing'].includes(r.getString('status'))) r.set('archived_at', b.action === 'archive' ? new Date().toISOString() : '')
      else throw new BadRequestError('Action indisponible pour cet e-mail.')
      app.save(r); c.audit(app, u, r, b.action); saved = r
    })
    // The durable job is committed before contacting Microsoft. A failed dispatch
    // leaves it available to the cron; this path only targets the newly queued mail.
    if (queued) {
      try { require(`${__hooks}/lib/messaging-worker.js`)(e.app, saved.id) }
      catch { e.app.logger().error('Messaging immediate dispatch interrupted', 'message_id', saved.id) }
      saved = c.own(e.app, e.auth, saved.id)
    }
    return e.json(200, c.dto(saved))
  },
}
