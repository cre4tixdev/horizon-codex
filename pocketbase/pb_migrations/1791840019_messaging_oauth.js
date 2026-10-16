migrate((app) => {
  const text = (name, max = 255, hidden = false) => new TextField({ name, max, hidden })
  const rel = (name, table) => new RelationField({ name, collectionId: app.findCollectionByNameOrId(table).id, maxSelect: 1, cascadeDelete: false })
  const create = (name, fields, indexes) => {
    const c = new Collection({ name, type: 'base', listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null })
    for (const field of [...fields, new AutodateField({ name: 'created', onCreate: true }), new AutodateField({ name: 'updated', onCreate: true, onUpdate: true })]) c.fields.add(field)
    c.indexes = indexes; app.save(c)
  }
  create('messaging_oauth_connections', [rel('mailbox', 'messaging_mailboxes'), text('tenant_id'), text('client_id'), text('account_id'), text('account_address'), text('access_cipher', 20000, true), text('refresh_cipher', 20000, true), new DateField({ name: 'expires_at' }), rel('connected_by', 'core_users'), new SelectField({ name: 'status', values: ['connected', 'refreshing', 'reconnect', 'disconnected'], maxSelect: 1, required: true }), text('generation', 64), text('refresh_claim', 64, true), new DateField({ name: 'refresh_claimed_at' })], ['CREATE UNIQUE INDEX idx_oauth_mailbox ON messaging_oauth_connections(mailbox)'])
  create('messaging_oauth_states', [text('state_hash', 64, true), text('verifier_cipher', 2000, true), rel('owner', 'core_users'), rel('mailbox', 'messaging_mailboxes'), text('mailbox_version'), text('connection_generation', 64), text('tenant_id'), text('client_id'), text('redirect_uri', 1000), new DateField({ name: 'expires_at' }), new BoolField({ name: 'consumed' })], ['CREATE UNIQUE INDEX idx_oauth_state ON messaging_oauth_states(state_hash)'])
  const outbox = app.findCollectionByNameOrId('messaging_outbox')
  outbox.fields.add(text('transport_version', 40)); outbox.fields.add(text('connection_generation', 64)); app.save(outbox)
  // Never replay an old application's credentials-based job through delegated OAuth.
  for (const j of app.findAllRecords('messaging_outbox')) {
    if (!['pending', 'processing'].includes(j.getString('status'))) continue
    const r = app.findRecordById('messaging_email_messages', j.getString('message'))
    if (r.getString('status') === 'sent') { j.set('status', 'complete'); app.save(j); continue }
    const state = j.getString('status') === 'processing' || r.getString('status') === 'processing' ? 'uncertain' : 'failed'
    const label = state === 'uncertain' ? 'Ancien traitement interrompu : vérifiez les éléments envoyés Microsoft avant toute nouvelle préparation.' : 'Ancienne file arrêtée lors du passage OAuth délégué. Vérifiez puis remettez explicitement cet e-mail en file.'
    j.set('status', state); j.set('last_error', label); app.save(j)
    r.set('status', state); r.set('error', label); app.save(r)
  }
}, () => { throw new Error('Conserver les connexions et historiques. Restaurer une sauvegarde cohérente.') })
