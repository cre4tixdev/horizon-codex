migrate((app) => {
  const settings = app.findFirstRecordByData('settings_sales', 'key', 'default')
  const terms = JSON.parse(settings.getString('terms') || '[]')
  const current = terms.find((term) => term.active && term.is_default) || terms.find((term) => term.active)
  settings.set('terms', terms.map((term) => ({ ...term, is_default: term.id === current?.id })))
  app.save(settings)
}, (app) => {
  const settings = app.findFirstRecordByData('settings_sales', 'key', 'default')
  settings.set('terms', JSON.parse(settings.getString('terms') || '[]').map((term) => {
    const previous = { ...term }; delete previous.is_default; return previous
  }))
  app.save(settings)
})
