import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <section aria-labelledby="not-found-title">
      <h1 id="not-found-title">Page introuvable</h1>
      <p className="mt-2 text-horizon-muted">Cette adresse ne correspond à aucune page Horizon.</p>
      <Link to="/" className="mt-4 inline-block text-horizon-magenta underline underline-offset-4">
        Revenir à l’accueil
      </Link>
    </section>
  )
}
