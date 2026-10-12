import { presenceLabels, type Presence } from '../schemas/account'
export function PresenceDot({ presence }: { presence: Presence }) {
  return <span className="presence-dot" data-presence={presence} role="img" aria-label={presenceLabels[presence]} title={presenceLabels[presence]} />
}
