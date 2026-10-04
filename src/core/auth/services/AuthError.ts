export class AuthError extends Error {
  constructor(public readonly kind: 'credentials' | 'unavailable' | 'installation' | 'invalid-session' | 'configuration') {
    const messages = {
      credentials: 'Connexion refusée. Vérifiez vos identifiants ou contactez votre administrateur.',
      unavailable: 'Le service de connexion est indisponible. Réessayez dans un instant.',
      installation: 'Les comptes Horizon ne sont pas encore configurés sur cette instance. Contactez votre administrateur.',
      'invalid-session': 'Votre session n’est plus autorisée. Veuillez vous reconnecter.',
      configuration: 'La connexion Horizon n’est pas encore configurée.',
    }
    super(messages[kind])
    this.name = 'AuthError'
  }
}
