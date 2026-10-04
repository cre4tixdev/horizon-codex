import { parsePocketBaseUrl } from './parsePocketBaseUrl'

export const environment = {
  pocketBaseUrl: parsePocketBaseUrl(import.meta.env.VITE_POCKETBASE_URL),
}
