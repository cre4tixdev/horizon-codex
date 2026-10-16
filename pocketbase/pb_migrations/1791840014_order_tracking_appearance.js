const additions = { order_tracking_header_light: '#FFF0F7', order_tracking_header_dark: '#352638' }
migrate((app) => {
  const record = app.findFirstRecordByData('settings_ux', 'key', 'default')
  record.set('config', { ...additions, ...JSON.parse(record.getString('config')) }); app.save(record)
}, (app) => {
  const record = app.findFirstRecordByData('settings_ux', 'key', 'default'), config = JSON.parse(record.getString('config'))
  for (const key of Object.keys(additions)) delete config[key]
  record.set('config', config); app.save(record)
})
