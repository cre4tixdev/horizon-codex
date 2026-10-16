import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'
import { Plus, Coins } from 'lucide-react'
import { HButton } from '../../../shared/ui/HButton'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HSaveButton } from '../../../shared/ui/HSaveButton'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HFieldLabel } from '../../../shared/ui/HFieldLabel'
import { HInput } from '../../../shared/ui/HInput'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { HListPagination } from '../../../shared/ui/HListPagination'
import { useListTableSorting } from '../../../shared/search/useListTableSorting'
import { GroupedResults } from '../../../shared/search/GroupedResults'
import { groupResults } from '../../../shared/search/listPresentation'
import type { z } from 'zod'
import type { allocationSchema } from '../schemas/leave'
import { leaveService } from '../services/LeaveService'
import { displayDate, displayDays, type LeaveChoices, type AllocationInput } from '../schemas/leave'
export function LeaveAllocations({ choices, year }: { choices: LeaveChoices; year: string }) {
  const [params, setParams] = useSearchParams(), client = useQueryClient(), employee = ''
  const data = useQuery({ queryKey: ['leave', 'allocations', params.toString()], queryFn: () => leaveService.allocations({ ...Object.fromEntries(params), year }), retry: false }), [adding, setAdding] = useState(false)
  const form = useForm<AllocationInput>({ defaultValues: { employee, type: choices.types.find((t) => t.tracked)?.id || '', year: Number(year), days: 0, reason: '', creation_key: '' } })
  const beneficiary = useWatch({ control: form.control, name: 'employee' }), allocationYear = useWatch({ control: form.control, name: 'year' })
  const save = useMutation({ mutationFn: leaveService.allocate, onSuccess: async () => { setAdding(false); await client.invalidateQueries({ queryKey: ['leave'] }) } })
  const beneficiaryBalance = useQuery({ queryKey: ['leave', 'balance', beneficiary, allocationYear], queryFn: () => leaveService.allocations({ employee: beneficiary, year: String(allocationYear) }), enabled: adding && Boolean(beneficiary) && Number.isInteger(allocationYear), retry: false })
  const sorting = useListTableSorting('-created', { Date: 'created', Employé: 'employee', Type: 'type', Année: 'year', Jours: 'days', Motif: 'reason', 'Attribué par': 'author' })
  const q = (params.get('q') || '').toLocaleLowerCase('fr'), rows = data.data?.items.filter((r) => !q || `${r.employee_name} ${r.type_label} ${r.reason} ${r.author_name}`.toLocaleLowerCase('fr').includes(q)) || []
  const table = (items: z.infer<typeof allocationSchema>[]) => <HDataTable columnBorders listSorting={sorting} data={items} columns={[{ header: 'Date', cell: ({ row }) => displayDate(row.original.created.slice(0, 10)) }, { id: 'Employé', header: 'Employé', accessorKey: 'employee_name' }, { id: 'Type', header: 'Type', accessorKey: 'type_label' }, { id: 'Année', header: 'Année', accessorKey: 'year' }, { header: 'Jours', cell: ({ row }) => <strong>{row.original.days > 0 ? '+' : ''}{displayDays(row.original.days)}</strong> }, { id: 'Motif', header: 'Motif', accessorKey: 'reason' }, { id: 'Attribué par', header: 'Attribué par', accessorKey: 'author_name' }]} columnAlignments={{ Jours: 'right', Année: 'center' }} />
  return <><section className="contact-panel"><HSectionHeading title="Allocations et corrections" icon={Coins} actions={<HButton variant="primary" onClick={() => { save.reset(); form.reset({ employee, type: choices.types.find((t) => t.tracked)?.id || '', year: Number(year), days: 0, reason: '', creation_key: crypto.randomUUID() }); setAdding(true) }}><Plus size={14} />Attribuer des jours</HButton>} /><p className="contact-muted">Chaque attribution reste dans l’historique. Pour corriger, ajoutez une nouvelle écriture positive ou négative avec un motif.</p></section>{data.isPending && <HLoadingIndicator label="Chargement des allocations" />}{data.error && <p role="alert" className="field-error">{data.error.message}<HButton onClick={() => void data.refetch()}>Réessayer</HButton></p>}<HListPagination page={data.data?.page || 1} totalPages={data.data?.totalPages} busy={data.isFetching} label="Pagination des allocations" onPageChange={(page) => setParams((current) => { const next = new URLSearchParams(current); next.set('page', String(page)); return next })} />{params.get('group') && params.get('group') !== 'none' ? <GroupedResults icon={Coins} noun="allocations" groups={groupResults(rows, (r) => params.get('group') === 'employee' ? { key: r.employee, label: r.employee_name } : { key: r.type, label: r.type_label })} render={table} /> : table(rows)}{!rows.length && data.data && <p className="contact-muted">Aucune allocation pour cette sélection.</p>}
  {adding && <HDialog open title="Attribuer des jours" description="Allocation individuelle ou correction. Cette écriture sera conservée avec votre nom et son motif." onOpenChange={(open) => { if (!open && !save.isPending) setAdding(false) }}><form className="dialog-form" onSubmit={form.handleSubmit((v) => save.mutate(v))}><div className="contact-fields"><label className="leave-span"><HFieldLabel required>Employé</HFieldLabel><HCombobox required label="Employé bénéficiaire" showCodes={false} value={beneficiary} options={data.data?.employees.filter((e) => e.active).map((e) => ({ value: e.id, label: e.label })) || []} onChange={(v) => form.setValue('employee', v, { shouldDirty: true })} /></label><label><HFieldLabel required>Type de congé</HFieldLabel><select className="h-input" {...form.register('type')}>{choices.types.filter((t) => t.tracked).map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select></label><label><HFieldLabel required>Année</HFieldLabel><HInput type="number" required min={2000} max={2200} {...form.register('year', { valueAsNumber: true })} /></label><label><HFieldLabel required>Nombre de jours</HFieldLabel><HInput type="number" required step="0.5" min={-1000} max={1000} {...form.register('days', { valueAsNumber: true })} /></label><label className="leave-span"><HFieldLabel required>Motif</HFieldLabel><textarea className="h-input" rows={3} required maxLength={2000} {...form.register('reason')} placeholder="Droits initiaux, récupération accordée, correction…" /></label></div>{beneficiaryBalance.data && <p className="contact-muted">Disponible en {allocationYear} : {beneficiaryBalance.data.balances.map((b) => `${b.label} : ${displayDays(b.available)}`).join(' · ')}</p>}{beneficiaryBalance.error && <p role="alert" className="field-error">{beneficiaryBalance.error.message}</p>}{save.error && <p role="alert" className="field-error">{save.error.message}</p>}<HDialogFooter><HButton disabled={save.isPending} onClick={() => setAdding(false)}>Annuler</HButton><HSaveButton hasChanges={form.formState.isDirty} pending={save.isPending} /></HDialogFooter></form></HDialog>}
  </>
}
