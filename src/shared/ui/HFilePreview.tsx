import type { ComponentProps } from 'react'
import { HDialog } from './HDialog'

export function HFilePreview({ name, url, pdf, onClose, onCloseAutoFocus }: { name: string; url: string; pdf: boolean; onClose: () => void; onCloseAutoFocus?: ComponentProps<typeof HDialog>['onCloseAutoFocus'] }) {
  return <HDialog open title={name} description="Document joint" className="activity-file-preview" onCloseAutoFocus={onCloseAutoFocus} onOpenChange={(open) => { if (!open) onClose() }}>{pdf ? <iframe title={`Aperçu ${name}`} src={url} /> : <img alt={name} src={url} />}</HDialog>
}
