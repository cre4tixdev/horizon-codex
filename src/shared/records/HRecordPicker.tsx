import { useRef, useState, type ComponentProps } from 'react'
import { HCombobox } from '../ui/HCombobox'
import { useRecordWorkspace, type RecordResult } from './recordContext'
type Props = ComponentProps<typeof HCombobox> & { resource: string; createLabel: string; canCreate: boolean; canInspect: boolean; initial?: Record<string, string> | undefined; ready: boolean; recordHref?: ((id: string) => string) | undefined; inspectDisabled?: boolean; onSaved?: ((result: RecordResult) => Promise<void>) | undefined }
export function HRecordPicker({ resource, createLabel, canCreate, canInspect, initial, ready, onSaved, recordHref, inspectDisabled, ...props }: Props) {
  const open = useRecordWorkspace()
  const control = useRef<HTMLDivElement>(null)
  const [resolved, setResolved] = useState<RecordResult>()
  const [error, setError] = useState<string>()
  const options = resolved?.id === props.value && !props.options.some((item) => item.value === resolved.id) ? [...props.options.filter((item) => item.value !== resolved.id), { value: resolved.id, label: resolved.label }] : props.options
  async function launch(id?: string, search = '') {
    if (!open) return
    setError(undefined)
    try {
    const result = await open({ resource, ...(id ? { id } : {}), initial: { ...initial, search }, returnFocus: () => control.current?.querySelector<HTMLElement>(id ? '.h-combobox-inspect' : '[role=combobox]')?.focus() })
    if (!result) return
    await onSaved?.(result); setResolved(result); if (!id) props.onChange(result.id) }
    catch (cause) { console.error('[record-picker] Reload failed'); setError(cause instanceof Error ? cause.message : 'La fiche a été enregistrée mais sa relecture a échoué.') }
  }
  return <div ref={control} className="h-record-picker"><HCombobox {...props} options={options} create={open && canCreate && ready && !props.disabled ? { label: createLabel, onClick: (search) => { void launch(undefined, search) } } : undefined} inspect={open && canInspect && !inspectDisabled && props.value ? { label: `Ouvrir la fiche : ${props.label}`, ...(recordHref ? { href: recordHref(props.value) } : {}), onClick: () => { void launch(props.value) } } : undefined} />{error && <p role="alert" className="field-error">{error}</p>}</div>
}
