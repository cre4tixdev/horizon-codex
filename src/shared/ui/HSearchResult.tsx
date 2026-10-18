import { Link } from 'react-router'
import { ArrowUpRight, type LucideIcon } from 'lucide-react'

export function HSearchResult({ href, label, description, icon: Icon, onSelect }: { href: string; label: string; description: string; icon: LucideIcon; onSelect?: () => void }) {
  return <Link to={href} onClick={onSelect} className="search-result"><Icon size={17} aria-hidden="true" /><span><strong>{label}</strong><small>{description}</small></span><ArrowUpRight size={15} aria-hidden="true" /></Link>
}
