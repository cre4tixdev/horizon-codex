migrate((app) => {
  const record = app.findFirstRecordByData('settings_ux', 'key', 'default')
  const config = JSON.parse(record.getString('config'))
  for (const key of ['quote_kit_background_light', 'quote_kit_background_dark']) if (config[key] === undefined) config[key] = '#071D35'
  record.set('config', config); app.save(record)
}, () => { throw new Error('Conserver les réglages UX ; utiliser une migration corrective.') })
