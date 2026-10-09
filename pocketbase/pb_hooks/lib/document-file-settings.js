const allowed = (event, app = event.app) => { const policy = require(`${__hooks}/lib/access-policy.js`); if (!policy.settings(app, event.auth) || !policy.permissions(app, event.auth).includes('documents.template.manage')) throw new ForbiddenError('La configuration des noms est réservée aux administrateurs et superusers habilités.') }
module.exports = {
  read(event) { allowed(event); return event.json(200, event.app.findFirstRecordByData('settings_document_files', 'key', 'default').publicExport()) },
  save(event) {
    allowed(event)
    const body = event.requestInfo().body
    if (Object.keys(body).some((key) => !['updated', 'patterns'].includes(key))) throw new BadRequestError('Champs non autorisés.')
    const patterns = require(`${__hooks}/lib/document-filenames.js`).validate(body.patterns)
    let result
    event.app.runInTransaction((app) => {
      allowed(event, app)
      const record = app.findFirstRecordByData('settings_document_files', 'key', 'default')
      if (record.getString('updated') !== body.updated) throw new ApiError(409, 'Les formats ont été modifiés. Rechargez les paramètres.')
      const before = record.publicExport()
      record.set('patterns', patterns); app.save(record)
      result = record.publicExport()
      require(`${__hooks}/lib/access-policy.js`).audit(app, 'settings_document_files', record.id, event.auth.id, before, result, 'update')
    })
    return event.json(200, result)
  },
}
