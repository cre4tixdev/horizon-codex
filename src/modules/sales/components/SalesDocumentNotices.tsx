import { useRef, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { useRecordWorkspace } from '../../../shared/records/recordContext'
import { HButton } from '../../../shared/ui/HButton'
import type { SalesDocumentNotice } from '../schemas/quotes'

function SalesDocumentLink({ href, label, onClosed, returnFocus }: { href: string; label: string; onClosed: () => void; returnFocus?: () => void }) {
  const open = useRecordWorkspace(), button = useRef<HTMLButtonElement>(null), [error, setError] = useState('')
  const match = /^(\/inventory\/operations|\/purchasing\/requests|\/purchasing\/orders|\/billing\/(customer|supplier|customer_credit|supplier_credit))\/([a-z0-9]{15})$/.exec(href)
  if (!match || !open) return null
  const resource = match[2] ? `billing-${match[2]}` : ({ '/inventory/operations': 'stock-operation', '/purchasing/requests': 'purchase-request', '/purchasing/orders': 'purchase-order' })[match[1]!]
  async function inspect() {
    setError('')
    try { await open!({ resource: resource!, id: match![3]!, returnFocus: () => returnFocus ? returnFocus() : button.current?.focus() }); onClosed() }
    catch (cause) { console.error('[sales] Document inspection failed'); setError(cause instanceof Error ? cause.message : 'La pièce ne peut pas être ouverte.') }
  }
  return <div className="order-revision-document-link"><HButton ref={button} size="small" variant="ghost" title={label} onClick={() => void inspect()} aria-label={label.startsWith('Ouvrir ') ? label : `Ouvrir ${label}`}><span>{label}</span><ArrowUpRight size={14} /></HButton>{error && <p role="alert" className="field-error">{error}</p>}</div>
}
export function SalesDocumentNotices({ items, blocking = false, onClosed, returnFocus }: { items: readonly SalesDocumentNotice[]; blocking?: boolean; onClosed: () => void; returnFocus?: () => void }) {
  return <ul className="order-revision-documents">{items.map((item, index) => <li key={index}><span {...(blocking ? { role: 'alert', className: 'field-error' } : {})}>{item.message}</span>{item.href && <SalesDocumentLink href={item.href} label={item.label} onClosed={onClosed} {...(returnFocus ? { returnFocus } : {})} />}</li>)}</ul>
}
