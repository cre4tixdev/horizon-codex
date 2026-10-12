const additions = { table_header_text_light: '#4C678E', table_header_text_dark: '#B8C5D7' }
migrate((app) => {
  const record = app.findFirstRecordByData('settings_ux', 'key', 'default')
  record.set('config', { ...additions, ...JSON.parse(record.getString('config')) }); app.save(record)
}, (app) => {
  const record = app.findFirstRecordByData('settings_ux', 'key', 'default'), config = JSON.parse(record.getString('config'))
  for (const key of Object.keys(additions)) delete config[key]
  record.set('config', config); app.save(record)
})
