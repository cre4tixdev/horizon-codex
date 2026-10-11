const additions = {
  "button_height": 32,
  "button_small_height": 30,
  "button_radius": 5,
  "button_padding_x": 12,
  "button_font": 12,
  "smart_height": 26,
  "smart_font": 10,
  "sidebar_link_height": 30,
  "sidebar_submenu_height": 27,
  "sidebar_group_gap": 7,
  "sidebar_title_top": 10,
  "sidebar_title_bottom": 6,
  "sidebar_link_gap": 2,
  "launcher_tile_size": 104,
  "launcher_icon_size": 38,
  "launcher_gap": 12,
  "background_light": "#F5F8FD",
  "background_dark": "#0E1726",
  "activity_light": "#E5EBF3",
  "activity_dark": "#111D2E",
  "row_odd_light": "#FFFFFF",
  "row_odd_dark": "#162236",
  "row_even_light": "#F4F5F7",
  "row_even_dark": "#1C2A40",
  "accent_background": "#E90072",
  "accent_text": "#FFFFFF",
  "button_background_light": "#FFFFFF",
  "button_background_dark": "#162236",
  "button_text_light": "#091C3A",
  "button_text_dark": "#E8EEF8",
  "button_border_light": "#DFE4EB",
  "button_border_dark": "#364860",
  "smart_background_light": "#FFFFFF",
  "smart_background_dark": "#162236",
  "smart_text_light": "#091C3A",
  "smart_text_dark": "#E8EEF8"
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
