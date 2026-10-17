migrate((app) => {
  const record = app.findFirstRecordByData('settings_ux', 'key', 'default')
  const config = JSON.parse(record.getString('config'))
  config.search_width = 840
  record.set('config', config); app.save(record)
}, () => { throw new Error('Conserver les réglages UX ; utiliser une migration corrective.') })
