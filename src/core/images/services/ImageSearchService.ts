import { imageSearchRepository } from '../repositories/ImageSearchRepository'
import type { ImageFormat, ImageSearchResult } from '../types/imageSearch'

export const imageSearchService = {
  search(query: string, format: ImageFormat) {
    const value = query.trim()
    if (value.length < 2 || value.length > 160) throw new Error('Saisissez entre 2 et 160 caractères.')
    return imageSearchRepository.search(value, format)
  },
  download(image: ImageSearchResult) { return imageSearchRepository.download(image) },
  googleURL(query: string, format: ImageFormat) {
    const value = query.trim()
    if (value.length < 2 || value.length > 160) throw new Error('Saisissez entre 2 et 160 caractères.')
    return `https://www.google.com/search?${new URLSearchParams({ tbm: 'isch', q: value + (format === 'all' ? '' : ` filetype:${format === 'jpeg' ? 'jpg' : format}`) })}`
  },
  async prepareClipboardImage(file: File) {
    if (file.size > 2097152 || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Choisissez une image PNG, JPEG ou WebP de 2 Mio maximum.')
    const bitmap = await createImageBitmap(file).catch(() => { throw new Error('L’image copiée est invalide. Copiez l’image elle-même, pas son adresse.') })
    bitmap.close()
    const extension = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1]
    return new File([file], `image-collee.${extension}`, { type: file.type })
  },
}
