import { Fragment } from 'react'
import { Link, type LinkProps } from 'react-router'
import { ChevronRight } from 'lucide-react'

export type BreadcrumbItem = { label: string; href?: string; state?: LinkProps['state'] }

export function HBreadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const visibleItems = items.length > 4 ? [items[0], ...items.slice(-2)] : items
  return (
    <nav aria-label="Fil d’Ariane" className="breadcrumb">
      <ol>
        {visibleItems.map((item, index) => item && (
          <Fragment key={`${item.label}-${index}`}>
            {index > 0 && <li aria-hidden="true"><ChevronRight size={13} /></li>}
            {items.length > 4 && index === 1 && <>
              <li>
                <details className="breadcrumb__overflow">
                  <summary aria-label="Afficher les niveaux intermédiaires">…</summary>
                  <div>{items.slice(1, -2).map((hidden, hiddenIndex) => hidden.href
                    ? <Link key={hiddenIndex} to={hidden.href} state={hidden.state}>{hidden.label}</Link>
                    : <span key={hiddenIndex}>{hidden.label}</span>)}</div>
                </details>
              </li>
              <li aria-hidden="true"><ChevronRight size={13} /></li>
            </>}
            <li>{index === visibleItems.length - 1 || !item.href
              ? <span title={item.label} aria-current={index === visibleItems.length - 1 ? 'page' : undefined}>{item.label}</span>
              : <Link to={item.href} state={item.state}>{item.label}</Link>}</li>
          </Fragment>
        ))}
      </ol>
    </nav>
  )
}
