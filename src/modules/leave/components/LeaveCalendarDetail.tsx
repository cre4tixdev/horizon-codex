import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HButton } from '../../../shared/ui/HButton'
import { HInput } from '../../../shared/ui/HInput'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { HTag } from '../../../shared/ui/HTag'
import { displayDate, displayDays, leaveStates, stateTone, type LeaveCalendarItem } from '../schemas/leave'
import { leaveService } from '../services/LeaveService'
export function LeaveCalendarDetail({ item, backQuery, onClose, onCloseFocus }: { item: LeaveCalendarItem; backQuery: string; onClose: () => void; onCloseFocus: () => void }) {
  const details = useQuery({ queryKey: ['leave', 'calendar-detail', item.id], queryFn: () => leaveService.record(item.id), enabled: Boolean(item.id), retry: false, gcTime: 0 })
  const record = details.isSuccess ? details.data : undefined
  return <HDialog open title={`Congé · ${item.employee_name}`} description="Détail de l’absence sur la période sélectionnée." onCloseAutoFocus={(event) => { event.preventDefault(); onCloseFocus() }} onOpenChange={(open) => { if (!open) onClose() }}><div className="dialog-form">
    <div><HTag tone={stateTone(item.status)}>{leaveStates[item.status]}</HTag></div>
    <div className="contact-fields"><label>Collaborateur<HInput readOnly value={item.employee_name} /></label><label>Durée<HInput readOnly value={displayDays(item.duration)} /></label><label>Du<HInput readOnly value={`${displayDate(item.start_date)} · ${item.start_half === 'pm' ? 'Après-midi' : 'Matin'}`} /></label><label>Au<HInput readOnly value={`${displayDate(item.end_date)} · ${item.end_half === 'am' ? 'Matin' : 'Après-midi'}`} /></label>{record && <><label>Nature du congé<HInput readOnly value={record.type_label} /></label><label>Manager<HInput readOnly value={record.direct_declaration ? 'Déclaration directe · RH informés' : record.manager_name || 'À définir'} /></label></>}</div>
    {item.id && details.isPending && <HLoadingIndicator label="Chargement du détail du congé" />}
    {details.error && <p role="alert" className="field-error">{details.error.message}<HButton onClick={() => void details.refetch()}>Réessayer</HButton></p>}
    {!item.id && <p className="contact-muted">Seules les informations de disponibilité sont partagées. Le type de congé et les commentaires restent confidentiels.</p>}
    {record?.reason && <label className="h-form-field">Commentaire<textarea className="h-input" aria-label="Commentaire" readOnly rows={3} value={record.reason} /></label>}
  </div><HDialogFooter><HButton onClick={onClose}>Fermer</HButton>{record && <HButton asChild><Link to={`/leave/${record.id}`} state={{ leaveListQuery: backQuery }}>Ouvrir la demande</Link></HButton>}</HDialogFooter>
  </HDialog>
}
