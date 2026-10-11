const additions = { sidebar_background_top: '#031C2C', sidebar_background_middle: '#071D35', sidebar_background_bottom: '#0B1832', sidebar_text_color: '#D5E2EF', sidebar_icon_color: '#D5E2EF', sidebar_title_color: '#93A0B6', sidebar_submenu_color: '#AEBFD2', sidebar_active_start: '#DC006A', sidebar_active_end: '#7C185E', sidebar_active_text: '#FFFFFF', sidebar_hover_color: '#FFFFFF', sidebar_width: 216, sidebar_font: 12.5, sidebar_submenu_font: 11.5, sidebar_title_font: 10, sidebar_icon_size: 16, sidebar_radius: 5, sidebar_padding_x: 11, sidebar_submenu_indent: 18 }
migrate((app) => {
  const record = app.findFirstRecordByData('settings_ux', 'key', 'default')
  record.set('config', { ...additions, ...JSON.parse(record.getString('config')) }); app.save(record)
}, (app) => {
  const record = app.findFirstRecordByData('settings_ux', 'key', 'default'), config = JSON.parse(record.getString('config'))
  for (const key of Object.keys(additions)) delete config[key]
  record.set('config', config); app.save(record)
})
