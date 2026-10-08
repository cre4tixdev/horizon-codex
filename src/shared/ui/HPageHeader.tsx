import type { ReactNode } from 'react'
import { HRecordPageActions } from './HRecordPageActions'

export function HPageHeader({ title, description, actions, titleAccessory, actionsPlacement = 'breadcrumb' }: { title: string; description: string; actions?: ReactNode; titleAccessory?: ReactNode; actionsPlacement?: 'breadcrumb' | 'inline' }) {
  return (
    <div className="page-header">
      <div><h1>{title}</h1>{titleAccessory}<p>{description}</p></div>
      {actions && (actionsPlacement === 'inline' ? <div className="page-header__actions">{actions}</div> : <HRecordPageActions>{actions}</HRecordPageActions>)}
    </div>
  )
}
