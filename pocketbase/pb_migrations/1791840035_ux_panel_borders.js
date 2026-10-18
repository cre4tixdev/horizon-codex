migrate((app) => {
  const record = app.findFirstRecordByData('settings_ux', 'key', 'default')
  const config = JSON.parse(record.getString('config'))
  if (config.panel_border_light === undefined) config.panel_border_light = '#DCE5EF'
  if (config.panel_border_dark === undefined) config.panel_border_dark = '#364860'
  record.set('config', config); app.save(record)
}, () => { throw new Error('Conserver les réglages UX ; utiliser une migration corrective.') })
