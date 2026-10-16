const manage = (app, user) => {
  const policy = require(`${__hooks}/lib/access-policy.js`)
  return policy.settings(app, user) && policy.permissions(app, user).includes('documents.template.manage')
}
const guard = (event) => { if (!manage(event.app, event.auth)) throw new ForbiddenError('La gestion des modèles est réservée aux administrateurs et superusers habilités.') }
const get = (app, id) => { if (!/^[a-z0-9]{15}$/.test(id || '')) throw new BadRequestError('Modèle invalide.'); return app.findRecordById('documents_templates', id) }
const dto = (app, record) => ({ ...record.publicExport(), version: record.getString('current_version') ? app.findRecordById('documents_template_versions', record.getString('current_version')).getInt('version') : 0 })
const audit = (app, user, record, action) => require(`${__hooks}/lib/access-policy.js`).audit(app, 'documents_templates', record.id, user.id, null, { name: record.getString('name'), status: record.getString('status'), current_version: record.getString('current_version') }, action)
const exact = (body, keys) => { if (Object.keys(body).some((key) => !keys.includes(key))) throw new BadRequestError('Champs non autorisés.') }
const sourceAccess = (app, user) => ({ invoice: require(`${__hooks}/lib/access-policy.js`).permissions(app, user).includes('billing.read'), stock_operation: require(`${__hooks}/lib/activity.js`).allowed(app, user, false, 'inventory'), quote: require(`${__hooks}/lib/activity.js`).allowed(app, user, false, 'sales'), purchase_order: require(`${__hooks}/lib/purchasing.js`).allowed(app, user), product_label: require(`${__hooks}/lib/catalog.js`).allowed(app, user) })
const prepare = (app, user, body) => {
    if ([body.quote_id, body.product_id, body.purchase_order_id, body.stock_operation_id].filter(Boolean).length !== 1) throw new BadRequestError('Choisissez une seule source pour l’aperçu.')
    const stockOperation = Boolean(body.stock_operation_id), label = Boolean(body.product_id), purchase = Boolean(body.purchase_order_id)
    const context = stockOperation ? require(`${__hooks}/lib/stock-document-context.js`)(app, user, body.stock_operation_id) : purchase ? require(`${__hooks}/lib/purchasing-document-context.js`)(app, user, body.purchase_order_id) : label ? require(`${__hooks}/lib/catalog.js`).documentContext(app, user, body.product_id) : require(`${__hooks}/lib/sales-document-context.js`)(app, user, body.quote_id)
    let layout
    if (body.content_json) { if (!manage(app, user)) throw new ForbiddenError('Accès refusé.'); layout = body.content_json } else if (stockOperation && !body.template_id) { layout = require(`${__hooks}/lib/document-default-stock.js`)(context) } else if (purchase && !body.template_id) { layout = require(`${__hooks}/lib/document-default-purchase.js`)() } else if (label && !body.template_id) { layout = require(`${__hooks}/lib/document-default-label.js`)() } else {
      const record = get(app, body.template_id)
      if (record.getString('status') === 'archived' || !record.getString('current_version')) throw new BadRequestError('Choisissez un modèle publié.')
      if (record.getString('document_type') !== (stockOperation ? 'stock_operation' : purchase ? 'purchase_order' : label ? 'product_label' : 'quote')) throw new BadRequestError('Ce modèle ne correspond pas à la pièce sélectionnée.')
      layout = JSON.parse(app.findRecordById('documents_template_versions', record.getString('current_version')).getString('content_json'))
    }
    if (!['html', 'pdf'].includes(body.format)) throw new BadRequestError('Format d’aperçu invalide.')
    const rendered = require(`${__hooks}/lib/document-renderer.js`)(layout, context)
    const filename = stockOperation ? require(`${__hooks}/lib/document-filenames.js`).filename(app, 'delivery_note', { number: context.fields['stock.number'], date: context.fields['stock.document_date'], opportunity: context.fields['opportunity.title'], opportunity_number: context.fields['opportunity.number'], title: context.fields['stock.title'] }) : label ? `Etiquette-${String(context.fields['product.reference']).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80)}.pdf` : require(`${__hooks}/lib/document-filenames.js`).filename(app, purchase ? 'purchase_order' : 'quote', { number: context.fields[purchase ? 'purchase.number' : 'quote.quote_number'], date: context.fields[purchase ? 'purchase.document_date' : 'quote.quote_date'], company: context.fields['company.name'], opportunity: context.fields['opportunity.title'], opportunity_number: context.fields['opportunity.number'], title: context.fields[purchase ? 'purchase.title' : 'quote.title'], owner: context.fields['owner.name'], contact: context.fields['contact.name'] })
    return { layout, rendered, filename, context }
}
module.exports = {
  prepare,
  formats(event) {
    const administrative = manage(event.app, event.auth), rights = sourceAccess(event.app, event.auth)
    if (!administrative && !Object.values(rights).some(Boolean)) throw new ForbiddenError('Accès aux formats refusé.')
    return event.json(200, { items: event.app.findRecordsByFilter('documents_paper_formats', administrative ? 'id != ""' : 'active = true', 'name,id', 500, 0).map((record) => record.publicExport()) })
  },
  saveFormat(event) {
    guard(event)
    const body = event.requestInfo().body; exact(body, ['id', 'updated', 'name', 'width_mm', 'height_mm', 'active'])
    if (typeof body.name !== 'string' || !body.name.trim() || body.name.length > 80 || typeof body.active !== 'boolean') throw new BadRequestError('Vérifiez le nom et la disponibilité du format.')
    for (const key of ['width_mm', 'height_mm']) if (typeof body[key] !== 'number' || !Number.isFinite(body[key]) || body[key] < 10 || body[key] > 1000 || Math.abs(body[key] * 100 - Math.round(body[key] * 100)) > 0.00001) throw new BadRequestError('Dimensions : de 10 à 1000 mm, deux décimales maximum.')
    let result
    event.app.runInTransaction((app) => {
      if (!manage(app, event.auth)) throw new ForbiddenError('Accès refusé.')
      if (body.id && !/^[a-z0-9]{15}$/.test(body.id)) throw new BadRequestError('Format invalide.')
      const record = body.id ? app.findRecordById('documents_paper_formats', body.id) : new Record(app.findCollectionByNameOrId('documents_paper_formats'))
      if (body.id && record.getString('updated') !== body.updated) throw new ApiError(409, 'Le format a été modifié. Rechargez la liste.')
      const before = body.id ? record.publicExport() : null
      if (app.findRecordsByFilter('documents_paper_formats', 'id != {:id}', '', 500, 0, { id: record.id }).some((item) => item.getString('name').toLowerCase() === body.name.trim().toLowerCase())) throw new BadRequestError('Ce nom de format existe déjà.')
      for (const key of ['name', 'width_mm', 'height_mm', 'active']) record.set(key, key === 'name' ? body.name.trim() : body[key])
      app.save(record)
      require(`${__hooks}/lib/access-policy.js`).audit(app, 'documents_paper_formats', record.id, event.auth.id, before, record.publicExport(), body.id ? 'update' : 'create')
      result = record.publicExport()
    })
    return event.json(200, result)
  },
  list(event) {
    const administrative = manage(event.app, event.auth), rights = sourceAccess(event.app, event.auth)
    if (!administrative && !Object.values(rights).some(Boolean)) throw new ForbiddenError('Accès aux modèles refusé.')
    const records = event.app.findRecordsByFilter('documents_templates', administrative ? 'id != ""' : 'current_version != "" && status != "archived"', 'name,id', 500, 0)
    return event.json(200, { items: records.filter((record) => administrative || rights[record.getString('document_type')]).map((record) => administrative ? dto(event.app, record) : { id: record.id, name: record.getString('name'), document_type: record.getString('document_type'), version: dto(event.app, record).version, current_version: record.getString('current_version') }) })
  },
  record(event) { guard(event); return event.json(200, dto(event.app, get(event.app, event.request.pathValue('id')))) },
  save(event) {
    guard(event)
    const body = event.requestInfo().body
    exact(body, ['id', 'updated', 'name', 'content_json', 'document_type'])
    if (typeof body.name !== 'string' || !body.name.trim() || body.name.length > 150) throw new BadRequestError('Donnez un nom au modèle (150 caractères maximum).')
    const documentType = body.document_type || 'quote'
    if (!['quote', 'product_label', 'purchase_order', 'stock_operation', 'invoice'].includes(documentType)) throw new BadRequestError('Type de pièce invalide.')
    const layout = require(`${__hooks}/lib/document-layout.js`).validate(body.content_json)
    let result
    event.app.runInTransaction((app) => {
      if (!manage(app, event.auth)) throw new ForbiddenError('Accès refusé.')
      const record = body.id ? get(app, body.id) : new Record(app.findCollectionByNameOrId('documents_templates'))
      if (body.id && record.getString('updated') !== body.updated) throw new ApiError(409, 'Le modèle a été modifié. Rechargez la fiche.')
      if (record.getString('status') === 'archived') throw new BadRequestError('Ce modèle est archivé.')
      if (body.id && record.getString('document_type') !== documentType) throw new BadRequestError('Le type d’un modèle existant ne peut pas être changé.')
      for (const [key, value] of Object.entries({ name: body.name.trim(), content_json: layout, document_type: documentType, module: ['product_label', 'stock_operation'].includes(documentType) ? 'inventory' : documentType === 'invoice' ? 'billing' : documentType === 'purchase_order' ? 'purchasing' : 'sales', language: 'fr', status: 'draft' })) record.set(key, value)
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
      if (['quote', 'purchase_order', 'stock_operation', 'invoice'].includes(record.getString('document_type')) && !layout.blocks.some((block) => block.kind === 'table')) throw new BadRequestError('Ajoutez un tableau de lignes avant de publier ce modèle.')
      if (record.getString('document_type') === 'product_label' && !layout.blocks.some((block) => block.kind === 'barcode')) throw new BadRequestError('Ajoutez un bloc code-barres avant de publier l’étiquette.')
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
    const body = event.requestInfo().body; exact(body, ['stock_operation_id', 'quote_id', 'product_id', 'purchase_order_id', 'template_id', 'content_json', 'format'])
    const { layout, rendered, filename, context } = prepare(event.app, event.auth, body)
    if (body.format === 'pdf') return require(`${__hooks}/lib/gotenberg.js`)(event, layout, rendered, filename)
    return event.json(200, { html: rendered.preview, warnings: context.warnings, filename, page: require(`${__hooks}/lib/document-layout.js`).pageDimensions(layout) })
  },
}
