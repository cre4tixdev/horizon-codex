import { useId, useState } from 'react'
import { HInput } from './HInput'
/** Compact shared color input: native picker plus an editable, validated hex code. */
export function HColorField({ label, caption, value, onChange }: { caption?: string; label: string; value: string; onChange: (value: string) => void }) {
  const id = useId(), [draft, setDraft] = useState({ source: value, text: value })
  const text = draft.source === value ? draft.text : value, valid = /^#[a-f0-9]{6}$/i.test(text)
  return <div className="h-color-field"><label htmlFor={id}>{caption || label}</label><div className="h-color-control"><div className="h-color-swatch" title={`${label} · ${value}`}><span style={{ backgroundColor: value }} /><input id={id} type="color" aria-label={label} value={value} onChange={(event) => onChange(event.target.value.toUpperCase())} /></div><HInput aria-label={`Code hexadécimal : ${label}`} value={text.toUpperCase()} maxLength={7} spellCheck={false} autoComplete="off" aria-invalid={!valid} onChange={(event) => { const next = event.target.value; setDraft({ source: value, text: next }); if (/^#[a-f0-9]{6}$/i.test(next)) onChange(next.toUpperCase()) }} onBlur={() => setDraft({ source: value, text: value })} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); if (valid) onChange(text.toUpperCase()); else setDraft({ source: value, text: value }) } }} /></div></div>
}
