import { createContext, useContext, type ReactNode } from 'react'
export type RecordResult = { id: string; label: string }
export type RecordRequest = { resource: string; id?: string; initial?: Record<string, string>; returnFocus?: () => void }
export type RecordSession = RecordRequest & { onSaved: (result: RecordResult) => void; onClose: () => void; report: (state: { dirty: boolean; busy: boolean }) => void }
export type RecordAdapter = { path: string; createTitle: string; viewTitle: string; render: (session: RecordSession) => ReactNode }
export const RecordWorkspaceContext = createContext<((request: RecordRequest) => Promise<RecordResult | undefined>) | undefined>(undefined)
export const RecordSessionContext = createContext<RecordSession | undefined>(undefined)
export function useRecordWorkspace() { return useContext(RecordWorkspaceContext) }
export function useRecordSession() { return useContext(RecordSessionContext) }
