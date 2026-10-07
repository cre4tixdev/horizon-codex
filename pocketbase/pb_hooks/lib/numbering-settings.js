module.exports = (event) => {
  const user = event.auth
  if (!require(`${__hooks}/lib/access-policy.js`).settings(event.app, user)) throw new ForbiddenError('Paramétrage réservé à Admin et Superuser.')
  if (!user || user.collection().name !== 'core_users' || !user.getBool('active')) throw new ForbiddenError('Accès aux séquences refusé.')
  const role = event.app.findRecordById('core_roles', user.getString('role'))
  if (!role.getBool('active') || !JSON.parse(role.getString('permissions') || '[]').includes('settings.references')) throw new ForbiddenError('Modification des séquences non autorisée.')
  const body = event.requestInfo().body
  const fields = ['start_value', 'next_value', 'prefix', 'suffix', 'padding']
  if (!body || Object.keys(body).some((key) => !['id', 'updated', 'expected_next_value', 'input'].includes(key)) || typeof body.id !== 'string' || !/^[a-z0-9]{15}$/.test(body.id) || typeof body.updated !== 'string') throw new BadRequestError('Séquence invalide.')
  const input = body.input
  if (!input || Array.isArray(input) || typeof input !== 'object' || Object.keys(input).some((key) => !fields.includes(key))) throw new BadRequestError('Champs de séquence invalides.')
  for (const key of ['start_value', 'next_value']) if (!Number.isInteger(input[key]) || input[key] < 1 || input[key] > 999999999998) throw new BadRequestError('Compteur entier positif requis.')
  if (input.next_value < input.start_value || !Number.isInteger(input.padding) || input.padding < 1 || input.padding > 12) throw new BadRequestError('Départ ou nombre de chiffres invalide.')
  for (const key of ['prefix', 'suffix']) if (typeof input[key] !== 'string' || input[key].length > 20 || /[{}]/.test(input[key]) || Array.from(input[key]).some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) throw new BadRequestError('Préfixe ou suffixe invalide.')
  let saved
  event.app.runInTransaction((app) => {
    const record = app.findRecordById('settings_numbering_sequences', body.id)
    if (record.getString('updated') !== body.updated || record.getInt('next_value') !== body.expected_next_value) throw new ApiError(409, 'La séquence a changé. Rechargez-la avant de réessayer.')
    if (record.getBool('has_issued') && (input.start_value !== record.getInt('start_value') || input.next_value < record.getInt('next_value'))) throw new BadRequestError('Une séquence utilisée ne peut pas revenir en arrière ni changer de départ.')
    if (record.getString('pattern') !== '{sequence}' || record.getString('reset_rule') !== 'never') throw new BadRequestError('Format de séquence non pris en charge.')
    const before = record.publicExport()
    for (const key of fields) record.set(key, input[key])
    app.save(record)
    saved = record.publicExport()
    const audit = new Record(app.findCollectionByNameOrId('core_audit'))
    for (const [key, value] of Object.entries({ user: user.id, module: 'settings', action: 'update', entity: 'settings_numbering_sequences', entity_id: record.id, before, after: saved, metadata: { source: 'server' } })) audit.set(key, value)
    app.save(audit)
  })
  return event.json(200, saved)
}
