const bounds = {
  search_width: [400, 1200],
  filter_option_height: [24, 56],
  filter_button_height: [24, 56],
  filter_font: [8, 20],

  sidebar_width: [180, 360], sidebar_font: [9, 18], sidebar_submenu_font: [8, 18], sidebar_title_font: [8, 16],
  sidebar_icon_size: [12, 28], sidebar_radius: [0, 20], sidebar_padding_x: [4, 24], sidebar_submenu_indent: [0, 40],
  button_height: [24, 56],
  button_small_height: [24, 56],
  button_radius: [0, 24],
  button_padding_x: [0, 40],
  button_font: [8, 24],
  smart_height: [20, 56],
  smart_font: [8, 24],
  sidebar_link_height: [24, 56],
  sidebar_submenu_height: [20, 48],
  sidebar_group_gap: [0, 40],
  sidebar_title_top: [0, 32],
  sidebar_title_bottom: [0, 32],
  sidebar_link_gap: [0, 20],
  launcher_tile_size: [64, 180],
  launcher_icon_size: [20, 64],
  launcher_gap: [4, 32],
  row_height: [28, 64],
  table_font: [8, 24],
  control_height: [24, 56],
  control_font: [8, 24],
  label_font: [8, 20],
  title_font: [12, 40],
  page_margin: [0, 100],
  panel_padding_x: [0, 48],
  panel_padding_y: [0, 48],
  panel_radius: [0, 24],
  section_gap: [0, 64],
  progress_gap: [0, 64],
}
const colorKeys = ["order_tracking_text_light", "order_tracking_text_dark", "order_tracking_header_light", "order_tracking_header_dark", "filter_background_light","filter_background_dark","filter_text_light","filter_text_dark","filter_border_light","filter_border_dark","filter_selected_background_light","filter_selected_background_dark","filter_selected_text_light","filter_selected_text_dark","filter_selected_border_light","filter_selected_border_dark","table_header_text_light", "table_header_text_dark", "table_border_light", "table_border_dark", "sidebar_background_top", "sidebar_background_middle", "sidebar_background_bottom", "sidebar_text_color", "sidebar_icon_color", "sidebar_title_color", "sidebar_submenu_color", "sidebar_active_start", "sidebar_active_end", "sidebar_active_text", "sidebar_hover_color", "header_light", "header_dark", "background_light", "background_dark", "activity_light", "activity_dark", "row_odd_light", "row_odd_dark", "row_even_light", "row_even_dark", "accent_background", "accent_text", "button_background_light", "button_background_dark", "button_text_light", "button_text_dark", "button_border_light", "button_border_dark", "smart_background_light", "smart_background_dark", "smart_text_light", "smart_text_dark"]
function allowed(app, user, write) {
  const policy = require(`${__hooks}/lib/access-policy.js`)
  if (!user || !user.getBool('active') || !app.findRecordById('core_roles', user.getString('role')).getBool('active') || write && !policy.settings(app, user)) throw new ForbiddenError('Paramétrage UX réservé aux administrateurs habilités.')
}
function dto(record) { return { id: record.id, updated: record.getString('updated'), config: JSON.parse(record.getString('config')) } }
module.exports = {
  read(event) { allowed(event.app, event.auth, false); return event.json(200, dto(event.app.findFirstRecordByData('settings_ux', 'key', 'default'))) },
  save(event) {
    allowed(event.app, event.auth, true)
    const body = event.requestInfo().body, config = body.config
    const keys = [...Object.keys(bounds), ...colorKeys]
    if (Object.keys(body).some((key) => !['updated', 'config'].includes(key)) || typeof body.updated !== 'string' || !config || typeof config !== 'object' || Array.isArray(config) || Object.keys(config).length !== keys.length || Object.keys(config).some((key) => !keys.includes(key)) || Object.entries(bounds).some(([key, range]) => !(key === 'sidebar_font' || key === 'sidebar_submenu_font' ? Number.isFinite(config[key]) && Number.isInteger(config[key] * 2) : Number.isInteger(config[key])) || config[key] < range[0] || config[key] > range[1]) || colorKeys.some((key) => typeof config[key] !== 'string' || !/^#[a-f0-9]{6}$/i.test(config[key]))) throw new BadRequestError('Réglages UX invalides ou hors limites.')
    let result
    event.app.runInTransaction((app) => {
      allowed(app, event.auth, true)
      const record = app.findFirstRecordByData('settings_ux', 'key', 'default')
      if (record.getString('updated') !== body.updated) throw new ApiError(409, 'Les réglages UX ont changé. Rechargez-les avant d’enregistrer.')
      const before = record.publicExport()
      record.set('config', config); app.save(record)
      require(`${__hooks}/lib/access-policy.js`).audit(app, 'settings_ux', record.id, event.auth.id, before, record.publicExport(), 'update')
      result = dto(record)
    })
    return event.json(200, result)
  },
}
