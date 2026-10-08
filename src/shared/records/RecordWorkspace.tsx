import { Suspense, useCallback, useRef, useState, type ReactNode } from 'react'
import { AlertDialog } from 'radix-ui'
import { HDialog } from '../ui/HDialog'
import { HButton } from '../ui/HButton'
import { HLoadingIndicator } from '../ui/HLoadingIndicator'
import { BreadcrumbActionsContext } from '../ui/breadcrumbActionsContext'
import { RecordWorkspaceContext, RecordSessionContext, type RecordAdapter, type RecordRequest, type RecordResult, type RecordSession } from './recordContext'
type Entry = { key: string; session: RecordSession; resolve: (result: RecordResult | undefined) => void }
export function RecordWorkspace({ adapters, children }: { adapters: Record<string, RecordAdapter>; children: ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [confirmation, setConfirmation] = useState<Entry>()
  const states = useRef(new Map<string, { dirty: boolean; busy: boolean }>())
  const finish = useCallback((entry: Entry, result?: RecordResult) => {
    states.current.delete(entry.key)
    setEntries((current) => current.filter((item) => item.key !== entry.key))
    setConfirmation(undefined)
    entry.resolve(result)
    requestAnimationFrame(() => entry.session.returnFocus?.())
  }, [])
  const close = useCallback((entry: Entry) => {
    const state = states.current.get(entry.key)
    if (state?.busy) return
    if (state?.dirty) setConfirmation(entry)
    else finish(entry)
  }, [finish])
  const open = useCallback((request: RecordRequest) => new Promise<RecordResult | undefined>((resolve, reject) => {
    if (!adapters[request.resource]) { console.error('[record-workspace] Unknown resource', request.resource); reject(new Error('Cette fiche ne peut pas être ouverte depuis ce champ.')); return }
    const key = crypto.randomUUID()
    states.current.set(key, { dirty: Boolean(request.initial?.search), busy: false })
    const entry: Entry = { key, resolve, session: { ...request, onSaved: (result) => finish(entry, result), onClose: () => close(entry), report: (state) => { states.current.set(key, state) } } }
    setEntries((current) => [...current, entry])
  }), [adapters, close, finish])
  return <RecordWorkspaceContext.Provider value={open}>{children}{entries.map((entry) => {
    const adapter = adapters[entry.session.resource]!
    return <HDialog key={entry.key} open title={entry.session.id ? adapter.viewTitle : adapter.createTitle} description="Votre saisie d’origine reste ouverte. Enregistrer reprend la fiche dans le champ." className="record-workspace-dialog" onCloseAutoFocus={(event) => { event.preventDefault(); entry.session.returnFocus?.() }} onOpenChange={(next) => { if (!next) close(entry) }}>
      <BreadcrumbActionsContext.Provider value={{ actions: null, trail: null, related: null, navigation: null }}><RecordSessionContext.Provider value={entry.session}><div className="record-workspace-body" onClickCapture={(event) => {
        const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null
        if (!anchor || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
        const url = new URL(anchor.href)
        if (url.origin !== window.location.origin) return
        const match = Object.entries(adapters).find(([, item]) => url.pathname.startsWith(`${item.path}/`))
        if (!match) return
        const id = url.pathname.slice(match[1].path.length + 1)
        if (!/^(new|[a-z0-9]{15})$/.test(id)) return
        event.preventDefault(); event.stopPropagation()
        void open({ resource: match[0], ...(id === 'new' ? {} : { id }), initial: { company: url.searchParams.get('company') || '' }, returnFocus: () => anchor.focus() })
      }}><Suspense fallback={<HLoadingIndicator label="Chargement de la fiche…" />}>{adapter.render(entry.session)}</Suspense></div></RecordSessionContext.Provider></BreadcrumbActionsContext.Provider>
    </HDialog>
  })}<AlertDialog.Root open={Boolean(confirmation)} onOpenChange={(next) => { if (!next) setConfirmation(undefined) }}><AlertDialog.Portal><AlertDialog.Overlay className="dialog-overlay" /><AlertDialog.Content className="dialog-content record-workspace-confirmation"><div className="dialog-heading"><div><AlertDialog.Title>Fermer sans enregistrer ?</AlertDialog.Title><AlertDialog.Description>Les changements de cette fiche seront abandonnés. Votre saisie d’origine sera conservée.</AlertDialog.Description></div></div><div className="dialog-form-footer"><AlertDialog.Cancel asChild><HButton>Continuer la saisie</HButton></AlertDialog.Cancel><HButton onClick={() => { if (confirmation) finish(confirmation) }}>Abandonner les changements</HButton></div></AlertDialog.Content></AlertDialog.Portal></AlertDialog.Root></RecordWorkspaceContext.Provider>
}
