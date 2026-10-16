const c = require(`${__hooks}/lib/messaging-common.js`), tables = { templates: 'messaging_email_templates', mailboxes: 'messaging_mailboxes', signatures: 'messaging_email_signatures' }
module.exports = {
  preview(e) {
    c.guard(e.app, e.auth, 'settings'); const b = e.requestInfo().body; c.exact(b, ['subject', 'body_json'])
    const values = { 'contact.prenom': 'Camille', 'contact.nom': 'Camille Martin', 'societe.nom': 'Société exemple', 'affaire.titre': 'Aménagement du studio', 'affaire.code': '11450', 'piece.numero': 'DEV-EXEMPLE', 'piece.titre': 'Équipements du studio', 'piece.montant': '1 250,00', 'piece.devise': 'EUR', 'utilisateur.nom': e.auth.getString('name'), 'expediteur.adresse': 'commercial@example.invalid' }
    return e.json(200, { subject: c.content.replace(b.subject || '', values), body_json: c.content.resolve(b.body_json, values), signature_snapshot: { type: 'doc', content: [] } })
  },
  read(e) {
    c.guard(e.app, e.auth, 'settings')
    return e.json(200, { configured: require(`${__hooks}/lib/mail-provider.js`).configured(), variables: c.content.variables, users: c.all(e.app, 'core_users', 'active = true', {}, 'name,id').map((r) => ({ id: r.id, name: r.getString('name'), email: r.getString('email') })), ...Object.fromEntries(Object.entries(tables).map(([key, table]) => [key, c.all(e.app, table, '', {}, 'name,id').map((r) => ({ ...r.publicExport(), ...(key === 'mailboxes' ? { connection: require(`${__hooks}/lib/messaging-oauth.js`).summary(e.app, r.id) } : {}) }))])) })
  },
  save(e) {
    c.guard(e.app, e.auth, 'settings'); const b = e.requestInfo().body; c.exact(b, ['kind', 'id', 'updated', 'input']); const table = tables[b.kind]; if (!table) throw new BadRequestError('Rubrique invalide.')
    const input = b.input, keys = b.kind === 'templates' ? ['name', 'context', 'language', 'subject', 'body_json', 'active', 'is_default'] : b.kind === 'mailboxes' ? ['name', 'address', 'active', 'allowed_users', 'receive_enabled'] : ['name', 'user', 'body_json', 'active', 'is_default']; c.exact(input, keys)
    if (typeof input.name !== 'string' || !input.name.trim() || input.name.length > 120 || typeof input.active !== 'boolean') throw new BadRequestError('Nom et état requis.')
    if (b.kind === 'templates') { if (!['generic', 'sales_quote', 'purchase_order'].includes(input.context) || !['fr', 'en'].includes(input.language) || typeof input.subject !== 'string' || input.subject.length > 500 || /[\r\n]/.test(input.subject)) throw new BadRequestError('Modèle invalide.'); c.content.replace(input.subject); c.content.resolve(input.body_json) }
    if (b.kind === 'signatures') { c.content.resolve(input.body_json); if (input.user && !c.get(e.app, 'core_users', input.user).getBool('active')) throw new BadRequestError('Utilisateur inactif.') }
    if (b.kind === 'mailboxes') { if (input.receive_enabled !== undefined && typeof input.receive_enabled !== 'boolean') throw new BadRequestError('Choix de réception invalide.'); if (!c.content.email(input.address) || input.address !== input.address.toLowerCase() || !Array.isArray(input.allowed_users) || input.allowed_users.length > 100 || new Set(input.allowed_users).size !== input.allowed_users.length || input.allowed_users.some((id) => !c.get(e.app, 'core_users', id).getBool('active'))) throw new BadRequestError('Adresse ou utilisateurs autorisés invalides.') }
    else if (typeof input.is_default !== 'boolean') throw new BadRequestError('Choix par défaut invalide.')
    let saved
    e.app.runInTransaction((app) => {
      c.guard(app, c.get(app, 'core_users', e.auth.id), 'settings'); const r = b.id ? c.get(app, table, b.id) : new Record(app.findCollectionByNameOrId(table)); if (b.id) c.version(r, b.updated)
      if (input.active && input.is_default) for (const other of c.all(app, table, 'is_default = true')) {
        if (other.id === r.id) continue
        if (b.kind === 'templates' ? other.getString('context') === input.context && other.getString('language') === input.language : other.getString('user') === input.user) { other.set('is_default', false); app.save(other) }
      }
      for (const key of keys) r.set(key, key === 'receive_enabled' ? (input[key] === undefined ? r.getBool(key) : input[key] === true) : key === 'name' ? input[key].trim() : input[key]); app.save(r); c.audit(app, e.auth, r, 'settings_save'); saved = r
    }); return e.json(200, saved.publicExport())
  },
}
