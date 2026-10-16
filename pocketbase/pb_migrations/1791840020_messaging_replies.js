migrate((app) => {
  const text = (name, max = 255, hidden = false) => new TextField({ name, max, hidden })
  const rel = (name, table) => new RelationField({ name, collectionId: app.findCollectionByNameOrId(table).id, maxSelect: 1, cascadeDelete: false })
  const date = (name) => new DateField({ name })
  const create = (name, fields, indexes) => {
    const c = new Collection({ name, type: 'base', listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null })
    for (const f of [...fields, new AutodateField({ name: 'created', onCreate: true }), new AutodateField({ name: 'updated', onCreate: true, onUpdate: true })]) c.fields.add(f)
    c.indexes = indexes; app.save(c); return c
  }
  const boxes = app.findCollectionByNameOrId('messaging_mailboxes'); boxes.fields.add(new BoolField({ name: 'receive_enabled' })); app.save(boxes)
  const connections = app.findCollectionByNameOrId('messaging_oauth_connections'); connections.fields.add(new JSONField({ name: 'granted_scopes', maxSize: 3000 })); app.save(connections)
  const states = app.findCollectionByNameOrId('messaging_oauth_states'); states.fields.add(new BoolField({ name: 'receive_enabled' })); app.save(states)
  const threads = create('messaging_email_threads', [rel('message', 'messaging_email_messages'), rel('mailbox', 'messaging_mailboxes'), text('account_id'), text('internet_message_id', 1000), text('conversation_id', 1000), new SelectField({ name: 'phase', values: ['discovery', 'conversation'], maxSelect: 1 }), text('next_link', 10000, true), text('claim', 64, true), date('claimed_at'), date('next_attempt_at'), date('last_sync_at'), text('last_error', 1000)], ['CREATE UNIQUE INDEX idx_email_thread ON messaging_email_threads(message)', 'CREATE INDEX idx_thread_due ON messaging_email_threads(next_attempt_at)'])
  create('messaging_email_replies', [rel('message', 'messaging_email_messages'), rel('mailbox', 'messaging_mailboxes'), text('provider_id', 1000), text('internet_message_id', 1000), text('dedup_key', 64), text('sender_address'), text('sender_name', 255), text('subject', 500), date('received_at'), text('body_text', 30000), new JSONField({ name: 'warnings', maxSize: 10000 }), new FileField({ name: 'attachments', protected: true, maxSelect: 10, maxSize: 2097152, mimeTypes: ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'] })], ['CREATE UNIQUE INDEX idx_email_reply_dedup ON messaging_email_replies(dedup_key)'])
  for (const m of app.findRecordsByFilter('messaging_email_messages', 'status = "sent" && source_context != "generic"', 'created,id', 0, 0)) {
    const r = new Record(threads); r.set('message', m.id); r.set('mailbox', m.getString('mailbox')); r.set('phase', 'discovery'); r.set('next_attempt_at', new Date().toISOString()); app.save(r)
  }
}, () => { throw new Error('Conserver les réponses et leurs pièces. Restaurer une sauvegarde cohérente.') })
