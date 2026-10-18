export function importImageSource(value: string) {
  const raw = value.replace(/^data:image\/(?:png|jpeg|webp);base64,/, '').replace(/\s/g, '')
  if (raw.length > 200000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(raw)) return ''
  const mime = raw.startsWith('iVBORw0KGgo') ? 'png' : raw.startsWith('/9j/') ? 'jpeg' : raw.startsWith('UklGR') ? 'webp' : ''
  return mime ? `data:image/${mime};base64,${raw}` : ''
}
