import { logoSearchRepository } from '../repositories/LogoSearchRepository'
import type { LogoFormat, LogoSearchResult } from '../types/logoSearch'

export const logoSearchService = {
  search(query: string, format: LogoFormat) {
    const value = query.trim()
    if (value.length < 2 || value.length > 160) throw new Error('Saisissez entre 2 et 160 caractères.')
    return logoSearchRepository.search(value, format)
  },
  download(image: LogoSearchResult) { return logoSearchRepository.download(image) },
}
