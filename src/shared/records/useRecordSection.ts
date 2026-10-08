import { useState } from 'react'

// Keep navigation outside editors that remount when their saved version changes.
export function useRecordSection(recordKey: string, initialSection = 'information') {
  const [selection, setSelection] = useState({ recordKey, section: initialSection })
  const section = selection.recordKey === recordKey ? selection.section : initialSection
  const setSection = (next: string) => setSelection({ recordKey, section: next })
  return [section, setSection] as const
}
