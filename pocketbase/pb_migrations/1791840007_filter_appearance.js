const additions = {
  "filter_option_height": 36,
  "filter_button_height": 26,
  "filter_font": 12,
  "filter_background_light": "#FFFFFF",
  "filter_background_dark": "#162236",
  "filter_text_light": "#091C3A",
  "filter_text_dark": "#E8EEF8",
  "filter_border_light": "#DCE5EF",
  "filter_border_dark": "#364860",
  "filter_selected_background_light": "#F5EFFC",
  "filter_selected_background_dark": "#302541",
  "filter_selected_text_light": "#7040A6",
  "filter_selected_text_dark": "#C1A0F2",
  "filter_selected_border_light": "#DAC5F2",
  "filter_selected_border_dark": "#65517E"
}
migrate((app) => {
  const record = app.findFirstRecordByData('settings_ux', 'key', 'default')
  const config = JSON.parse(record.getString('config'))
  record.set('config', { ...additions, ...config }); app.save(record)
}, (app) => {
  const record = app.findFirstRecordByData('settings_ux', 'key', 'default')
  const config = JSON.parse(record.getString('config'))
  for (const key of Object.keys(additions)) delete config[key]
  record.set('config', config); app.save(record)
})
