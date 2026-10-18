import { ClientResponseError } from 'pocketbase'

const labels: Record<string, string> = { email: 'E-mail', website: 'Site web', name: 'Nom de la société', first_name: 'Prénom', last_name: 'Nom', phone: 'Téléphone', mobile: 'Mobile', logo: 'Image', avatar: 'Image', company: 'Société', country: 'Pays', line1: 'Adresse', city: 'Ville' }

export function importErrorMessage(error: unknown): string {
  if (!(error instanceof ClientResponseError)) return 'L’import est indisponible ou a dépassé le délai. Consultez son historique avant de réessayer.'
  if (error.status === 404) return 'Installez le pack Imports Contacts avant d’utiliser cet assistant.'
  if ([400, 403, 409, 503].includes(error.status)) {
    const data: unknown = error.response.data
    const fields = data && typeof data === 'object' && !Array.isArray(data) ? Object.keys(data).filter((key) => Object.hasOwn(labels, key)) : []
    if (error.status === 400 && fields.length) return `Valeur refusée : ${fields.map((key) => labels[key]).join(', ')}. Corrigez les champs concernés dans la fiche d’import.`
    const message: unknown = error.response.message
    return typeof message === 'string' && message && message !== 'Something went wrong while processing your request.' ? message : 'L’enregistrement a été refusé. Vérifiez les lignes de l’import et les champs signalés.'
  }
  return 'L’import est indisponible ou a dépassé le délai. Consultez son historique avant de réessayer.'
}
