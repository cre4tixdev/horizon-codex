import { importImageSource } from './image'
import type { z } from 'zod'
import type { sourceSchema } from '../schemas/imports'

type OdooPage = z.infer<typeof sourceSchema>
// Publish a source only once every page has been read successfully.
export async function collectOdoo(read: (after: number) => Promise<OdooPage>, progress: (loaded: number, total: number) => void) {
  const rows: string[][] = [], identities = new Set<string>()
  let after = 0, first: OdooPage | undefined, bytes = 0
  for (;;) {
    const page = await read(after)
    first ??= page
    if (page.total !== first.total || page.namespace !== first.namespace || JSON.stringify(page.headers) !== JSON.stringify(first.headers)) throw new Error('La sélection Odoo a changé pendant la lecture. Relancez le chargement complet.')
    const idColumn = page.headers.indexOf('external_id')
    if (idColumn < 0) throw new Error('Identifiant Odoo absent de la réponse.')
    for (const row of page.rows) {
      if (!row[idColumn] || identities.has(row[idColumn])) throw new Error('Résultats Odoo incohérents. Relancez le chargement complet.')
      identities.add(row[idColumn]); rows.push(row)
      bytes += new TextEncoder().encode(JSON.stringify(row)).length + 1
    }
    if (bytes > 7_500_000) throw new Error('La sélection dépasse la capacité de cette simulation (8 Mo). Affinez la sélection ; aucune ligne partielle ne sera importée.')
    progress(rows.length, first.total)
    if (!page.has_more) {
      if (rows.length !== first.total) throw new Error('Le nombre de résultats Odoo a changé. Relancez le chargement complet.')
      const imageColumn = first.headers.indexOf('image_base64')
      const images = imageColumn < 0 ? [] : rows.map((row) => row[imageColumn] || '').filter(Boolean)
      return { headers: first.headers, namespace: first.namespace, rows, imageInfo: { received: images.length, valid: images.filter((value) => importImageSource(value)).length, fields: first.image_fields } }
    }
    if (!page.rows.length || page.after_id <= after || rows.length >= first.total) throw new Error('Pagination Odoo incohérente. Relancez le chargement complet.')
    after = page.after_id
  }
}
