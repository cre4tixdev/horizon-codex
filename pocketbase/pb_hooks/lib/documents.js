const manage = (app, user) => {
  const policy = require(`${__hooks}/lib/access-policy.js`)
  return policy.settings(app, user) && policy.permissions(app, user).includes('documents.template.manage')
}
const guard = (event) => { if (!manage(event.app, event.auth)) throw new ForbiddenError('La gestion des modèles est réservée aux administrateurs et superusers habilités.') }
const get = (app, id) => { if (!/^[a-z0-9]{15}$/.test(id || '')) throw new BadRequestError('Modèle invalide.'); return app.findRecordById('documents_templates', id) }
const dto = (app, record) => ({ ...record.publicExport(), version: record.getString('current_version') ? app.findRecordById('documents_template_versions', record.getString('current_version')).getInt('version') : 0 })
const audit = (app, user, record, action) => require(`${__hooks}/lib/access-policy.js`).audit(app, 'documents_templates', record.id, user.id, null, { name: record.getString('name'), status: record.getString('status'), current_version: record.getString('current_version') }, action)
const exact = (body, keys) => { if (Object.keys(body).some((key) => !keys.includes(key))) throw new BadRequestError('Champs non autorisés.') }
module.exports = {
  list(event) {
    const administrative = manage(event.app, event.auth)
    if (!administrative && !require(`${__hooks}/lib/activity.js`).allowed(event.app, event.auth, false, 'sales')) throw new ForbiddenError('Accès aux modèles refusé.')
    const records = event.app.findRecordsByFilter('documents_templates', administrative ? 'id != ""' : 'current_version != "" && status != "archived"', 'name,id', 500, 0)
    return event.json(200, { items: records.map((record) => administrative ? dto(event.app, record) : { id: record.id, name: record.getString('name'), version: dto(event.app, record).version, current_version: record.getString('current_version') }) })
  },
  record(event) { guard(event); return event.json(200, dto(event.app, get(event.app, event.request.pathValue('id')))) },
  save(event) {
    guard(event)
    const body = event.requestInfo().body
    exact(body, ['id', 'updated', 'name', 'content_json'])
    if (typeof body.name !== 'string' || !body.name.trim() || body.name.length > 150) throw new BadRequestError('Donnez un nom au modèle (150 caractères maximum).')
    const layout = require(`${__hooks}/lib/document-layout.js`).validate(body.content_json)
    let result
    event.app.runInTransaction((app) => {
      if (!manage(app, event.auth)) throw new ForbiddenError('Accès refusé.')
      const record = body.id ? get(app, body.id) : new Record(app.findCollectionByNameOrId('documents_templates'))
      if (body.id && record.getString('updated') !== body.updated) throw new ApiError(409, 'Le modèle a été modifié. Rechargez la fiche.')
      if (record.getString('status') === 'archived') throw new BadRequestError('Ce modèle est archivé.')
      for (const [key, value] of Object.entries({ name: body.name.trim(), content_json: layout, document_type: 'quote', module: 'sales', language: 'fr', status: 'draft' })) record.set(key, value)
      if (!body.id) record.set('created_by', event.auth.id)
      app.save(record); audit(app, event.auth, record, body.id ? 'update' : 'create'); result = dto(app, record)
    })
    return event.json(200, result)
  },
  publish(event) {
    guard(event); const body = event.requestInfo().body; exact(body, ['id', 'updated']); let result
    event.app.runInTransaction((app) => {
      if (!manage(app, event.auth)) throw new ForbiddenError('Accès refusé.')
      const record = get(app, body.id)
      if (record.getString('updated') !== body.updated) throw new ApiError(409, 'Le modèle a été modifié. Rechargez la fiche.')
      if (record.getString('status') === 'archived') throw new BadRequestError('Ce modèle est archivé.')
      if (record.getString('status') === 'published') { result = dto(app, record); return }
      const layout = require(`${__hooks}/lib/document-layout.js`).validate(JSON.parse(record.getString('content_json')))
      if (!layout.blocks.some((block) => block.kind === 'table')) throw new BadRequestError('Ajoutez un tableau de lignes avant de publier un modèle de devis.')
      const last = app.findRecordsByFilter('documents_template_versions', 'template = {:id}', '-version', 1, 0, { id: record.id })
      const version = new Record(app.findCollectionByNameOrId('documents_template_versions'))
      for (const [key, value] of Object.entries({ template: record.id, name: record.getString('name'), version: last.length ? last[0].getInt('version') + 1 : 1, content_json: layout, published_by: event.auth.id, published_at: new Date().toISOString() })) version.set(key, value)
      app.save(version); record.set('current_version', version.id); record.set('status', 'published'); app.save(record); audit(app, event.auth, record, 'publish'); result = dto(app, record)
    })
    return event.json(200, result)
  },
  archive(event) {
    guard(event); const body = event.requestInfo().body; exact(body, ['id', 'updated']); let result
    event.app.runInTransaction((app) => {
      if (!manage(app, event.auth)) throw new ForbiddenError('Accès refusé.')
      const record = get(app, body.id)
      if (record.getString('updated') !== body.updated) throw new ApiError(409, 'Le modèle a été modifié. Rechargez la fiche.')
      record.set('status', 'archived'); app.save(record); audit(app, event.auth, record, 'archive'); result = dto(app, record)
    }); return event.json(200, result)
  },
  delete(event) {
    guard(event); const body = event.requestInfo().body; exact(body, ['id', 'updated'])
    event.app.runInTransaction((app) => {
      if (!manage(app, event.auth)) throw new ForbiddenError('Accès refusé.')
      const record = get(app, body.id)
      if (record.getString('updated') !== body.updated) throw new ApiError(409, 'Le modèle a été modifié. Rechargez la fiche.')
      if (record.getString('current_version') || app.findRecordsByFilter('documents_template_versions', 'template = {:id}', '', 1, 0, { id: record.id }).length) throw new BadRequestError('Ce modèle possède des versions publiées. Archivez-le pour conserver son historique.')
      audit(app, event.auth, record, 'delete'); app.delete(record)
    })
    return event.json(200, { deleted: true })
  },
  preview(event) {
    const body = event.requestInfo().body; exact(body, ['quote_id', 'template_id', 'content_json', 'format'])
    const context = require(`${__hooks}/lib/sales-document-context.js`)(event.app, event.auth, body.quote_id)
    let layout
    if (body.content_json) { guard(event); layout = body.content_json } else {
      const record = get(event.app, body.template_id)
      if (record.getString('status') === 'archived' || !record.getString('current_version')) throw new BadRequestError('Choisissez un modèle publié.')
      layout = JSON.parse(event.app.findRecordById('documents_template_versions', record.getString('current_version')).getString('content_json'))
    }
    if (!['html', 'pdf'].includes(body.format)) throw new BadRequestError('Format d’aperçu invalide.')
    const rendered = require(`${__hooks}/lib/document-renderer.js`)(layout, context)
    const filename = require(`${__hooks}/lib/document-filenames.js`).filename(event.app, 'quote', { number: context.fields['quote.quote_number'], date: context.fields['quote.quote_date'], company: context.fields['company.name'], opportunity: context.fields['opportunity.title'], opportunity_number: context.fields['opportunity.number'], title: context.fields['quote.title'], owner: context.fields['owner.name'], contact: context.fields['contact.name'] })
    if (body.format === 'pdf') return require(`${__hooks}/lib/gotenberg.js`)(event, layout, rendered, filename)
    return event.json(200, { html: rendered.preview, warnings: context.warnings, filename, page: { format: 'A4', orientation: layout.orientation, width: layout.orientation === 'portrait' ? 210 : 297, height: layout.orientation === 'portrait' ? 297 : 210 } })
  },
}
