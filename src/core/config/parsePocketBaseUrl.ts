export function parsePocketBaseUrl(value: string | undefined): string | undefined {
  if (value === undefined || value === '') return undefined

  const message = 'Configuration PocketBase invalide : utiliser une URL HTTP(S) sans identifiants, paramètres ni fragment.'
  let url: URL

  try {
    url = new URL(value)
  } catch {
    throw new Error(message)
  }

  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username || url.password || url.search || url.hash
  ) {
    throw new Error(message)
  }

  return url.toString().replace(/\/+$/, '')
}
