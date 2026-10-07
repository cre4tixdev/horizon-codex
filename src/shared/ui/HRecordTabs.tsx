export function HRecordTabs({ items, value, onChange, label, idPrefix = 'contact-tab' }: { items: readonly { value: string; label: string; panel: string; count?: number | undefined }[]; value: string; onChange: (value: string) => void; label: string; idPrefix?: string }) {
  return <div className="contact-record-navigation" role="tablist" aria-label={label}>{items.map((item) => <button key={item.value} id={`${idPrefix}-${item.value}`} type="button" role="tab" aria-selected={value === item.value} aria-controls={item.panel} tabIndex={value === item.value ? 0 : -1} onClick={() => onChange(item.value)} onKeyDown={(event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const tabs = Array.from(event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role=tab]') || [])
    const index = tabs.indexOf(event.currentTarget)
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
    tabs[next]?.click(); tabs[next]?.focus()
  }}>{item.label}{item.count !== undefined && <span className="contact-tab-count">{item.count}</span>}</button>)}</div>
}
