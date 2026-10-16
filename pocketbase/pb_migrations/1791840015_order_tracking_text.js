const additions = { order_tracking_text_light: '#4C678E', order_tracking_text_dark: '#B8C5D7' }
migrate((app) => {
  const record = app.findFirstRecordByData('settings_ux', 'key', 'default')
  const config = JSON.parse(record.getString('config'))
  record.set('config', { ...additions, order_tracking_text_light: config.table_header_text_light || additions.order_tracking_text_light, order_tracking_text_dark: config.table_header_text_dark || additions.order_tracking_text_dark, ...config }); app.save(record)
}, (app) => {
  const record = app.findFirstRecordByData('settings_ux', 'key', 'default'), config = JSON.parse(record.getString('config'))
  for (const key of Object.keys(additions)) delete config[key]
  record.set('config', config); app.save(record)
})
