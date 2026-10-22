migrate((app) => {
  const record = app.findFirstRecordByData('settings_ux', 'key', 'default')
  const config = JSON.parse(record.getString('config'))
  const defaults = { quote_kit_border_width: 0, quote_kit_border_light: '#DCE5EF', quote_kit_border_dark: '#364860' }
  for (const key of Object.keys(defaults)) if (config[key] === undefined) config[key] = defaults[key]
  record.set('config', config); app.save(record)
}, () => { throw new Error('Conserver les réglages UX ; utiliser une migration corrective.') })
