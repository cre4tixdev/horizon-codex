import type { LogoFormat, LogoSearchResult } from '../types/logoSearch'
import { z } from 'zod'

const imageInfo = z.object({ url: z.string(), thumburl: z.string().optional(), descriptionurl: z.string(), mime: z.string(), thumbmime: z.string().optional(), width: z.number(), height: z.number() })
const responseSchema = z.object({ query: z.object({ pages: z.array(z.object({ pageid: z.number(), title: z.string(), index: z.number().optional(), imageinfo: z.array(imageInfo).optional() })).optional() }).optional() })
const mimeTypes = ['image/png', 'image/jpeg', 'image/webp']
function publicImage(url: string) { const parsed = new URL(url); if (parsed.protocol !== 'https:' || !['upload.wikimedia.org', 'thumb.wikimedia.org'].includes(parsed.hostname)) throw new Error('Adresse d’image inattendue.'); return url }
export const logoSearchRepository = {
  async search(query: string, format: LogoFormat): Promise<LogoSearchResult[]> {
    const suffix = format === 'all' ? '' : ` filemime:${format === 'jpeg' ? 'image/jpeg' : `image/${format}`}`
    const params = new URLSearchParams({ action: 'query', format: 'json', formatversion: '2', origin: '*', generator: 'search', gsrsearch: query + suffix, gsrnamespace: '6', gsrlimit: '24', prop: 'imageinfo', iiprop: 'url|mime|size|thumbmime', iiurlwidth: '500' })
    let response: Response
    try { response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { credentials: 'omit', signal: AbortSignal.timeout(15_000) }) }
    catch { throw new Error('La recherche d’images est indisponible. Réessayez.') }
    if (!response.ok) throw new Error(response.status === 429 ? 'Trop de recherches. Réessayez dans un instant.' : 'La recherche d’images est indisponible.')
    const parsed = responseSchema.safeParse(await response.json())
    if (!parsed.success) throw new Error('La réponse de la recherche d’images est invalide.', { cause: parsed.error })
    const data = parsed.data
    return (data.query?.pages ?? []).sort((a, b) => (a.index ?? 0) - (b.index ?? 0)).flatMap((page) => {
      const info = page.imageinfo?.[0]
      if (!info || ![...mimeTypes, 'image/svg+xml'].includes(info.mime)) return []
      // SVG logos are offered as Wikimedia-generated PNG previews, never raw SVG files.
      const mime = info.thumburl ? info.thumbmime ?? info.mime : info.mime
      if (!mimeTypes.includes(mime)) return []
      const source = new URL(info.descriptionurl)
      if (source.protocol !== 'https:' || source.hostname !== 'commons.wikimedia.org') return []
      return [{ id: page.pageid, title: page.title.replace(/^File:/, ''), imageUrl: publicImage(info.thumburl ?? info.url), sourceUrl: source.href, mime, width: info.width, height: info.height }]
    })
  },
  async download(image: LogoSearchResult): Promise<File> {
    let response: Response
    try { response = await fetch(publicImage(image.imageUrl), { credentials: 'omit', signal: AbortSignal.timeout(15_000) }) }
    catch { throw new Error('Cette image ne peut pas être téléchargée. Choisissez-en une autre ou importez un fichier.') }
    if (!response.ok) throw new Error('Téléchargement impossible. Choisissez une autre image.')
    if (Number(response.headers.get('content-length')) > 2097152) throw new Error('Choisissez une image de 2 Mio maximum.')
    const blob = await response.blob()
    if (blob.size > 2097152 || !mimeTypes.includes(blob.type)) throw new Error('Choisissez une image PNG, JPEG ou WebP de 2 Mio maximum.')
    const bitmap = await createImageBitmap(blob).catch(() => { throw new Error('Le fichier reçu n’est pas une image valide.') })
    bitmap.close()
    const extension = blob.type === 'image/jpeg' ? 'jpg' : blob.type.split('/')[1]
    return new File([blob], `logo-${image.id}.${extension}`, { type: blob.type })
  },
}
