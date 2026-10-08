migrate((app) => {
  const record = app.findFirstRecordByData('settings_sales', 'key', 'default')
  const widths = JSON.parse(record.getString('column_widths') || '{}')
  record.set('column_widths', { ...widths, position: Math.max(widths.position || 52, 52), is_option: widths.is_option || 52, actions: Math.max(widths.actions || 64, 64) })
  app.save(record)
}, () => { throw new Error('Restore a coherent backup to revert quote presentation settings.') })
