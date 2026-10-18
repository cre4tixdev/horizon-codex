migrate((app) => {
  const record = app.findFirstRecordByData('settings_ux', 'key', 'default')
  const config = JSON.parse(record.getString('config'))
  if (config.activity_gap === undefined) config.activity_gap = 32
  record.set('config', config); app.save(record)
}, () => { throw new Error('Conserver les réglages UX ; utiliser une migration corrective.') })
