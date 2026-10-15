import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Car, Plus } from 'lucide-react'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HButton } from '../../../shared/ui/HButton'
import { HSaveButton } from '../../../shared/ui/HSaveButton'
import { HSettingsTable } from '../../../shared/ui/HSettingsTable'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HInput } from '../../../shared/ui/HInput'
import { HFieldLabel } from '../../../shared/ui/HFieldLabel'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { SettingsEditButton } from '../../settings/components/SettingsEditButton'
import { expensesService } from '../services/ExpensesService'
import { type ExpenseVehicle, type ExpenseVehicleInput, vehicleInputSchema } from '../schemas/expenses'

export function ExpenseVehiclesPanel() {
  const query = useQuery({ queryKey: ['expenses', 'vehicles'], queryFn: expensesService.vehicles, retry: false })
  const [editor, setEditor] = useState<ExpenseVehicle | 'new'>()
  return <>
    <HSectionHeading title="Véhicules" icon={Car} description="Véhicules rattachés aux employés pour les dépenses de carburant." actions={<HButton size="small" disabled={!query.data} onClick={() => setEditor('new')}><Plus size={14} />Ajouter un véhicule</HButton>} />
    {query.error && <p role="alert" className="field-error">{query.error.message}<HButton onClick={() => void query.refetch()}>Réessayer</HButton></p>}
    {query.isPending && <p role="status">Chargement…</p>}
    {query.data && <HSettingsTable count={query.data.items.length} noun="véhicule"><table className="reference-table"><thead><tr><th>Marque</th><th>Modèle</th><th>Immatriculation</th><th>Employé</th><th>Actif</th><th /></tr></thead><tbody>{query.data.items.map((vehicle) => <tr key={vehicle.id}><td>{vehicle.brand}</td><td>{vehicle.model}</td><td>{vehicle.registration}</td><td>{vehicle.employee_name}</td><td>{vehicle.active ? 'Oui' : 'Non'}</td><td className="reference-table-actions"><SettingsEditButton label={`Modifier le véhicule ${vehicle.registration}`} onClick={() => setEditor(vehicle)} /></td></tr>)}</tbody></table></HSettingsTable>}
    {editor && query.data && <VehicleEditor key={editor === 'new' ? 'new' : editor.id} record={editor === 'new' ? undefined : editor} employees={query.data.employees} onClose={() => setEditor(undefined)} />}
  </>
}

function VehicleEditor({ record, employees, onClose }: { record?: ExpenseVehicle | undefined; employees: { id: string; label: string }[]; onClose: () => void }) {
  const client = useQueryClient()
  const [values, setValues] = useState<ExpenseVehicleInput>({ brand: record?.brand || '', model: record?.model || '', registration: record?.registration || '', employee: record?.employee || '', active: record?.active ?? true })
  const save = useMutation({ mutationFn: () => expensesService.vehicle(vehicleInputSchema.parse(values), record), onSuccess: async () => { await client.invalidateQueries({ queryKey: ['expenses'] }); onClose() } })
  const changed = !record || (Object.keys(values) as (keyof ExpenseVehicleInput)[]).some((key) => values[key] !== record[key])
  const employeeOptions = employees.map((employee) => ({ value: employee.id, label: employee.label }))
  if (record && !employeeOptions.some((employee) => employee.value === record.employee)) employeeOptions.push({ value: record.employee, label: record.employee_name })
  return <HDialog open title={record ? 'Modifier le véhicule' : 'Nouveau véhicule'} description="Renseignez le véhicule et son employé de rattachement." onOpenChange={(open) => { if (!open && !save.isPending) onClose() }}>
    <form id="expense-vehicle" className="dialog-form" onSubmit={(event) => { event.preventDefault(); save.mutate() }}>
      <HSectionHeading title="Véhicule" icon={Car} actions={<HSaveButton form="expense-vehicle" hasChanges={changed} pending={save.isPending} disabled={!vehicleInputSchema.safeParse(values).success} />} />
      <fieldset className="contact-fields access-fieldset" disabled={save.isPending}>
        <label><HFieldLabel required>Marque</HFieldLabel><HInput required maxLength={60} value={values.brand} onChange={(event) => setValues({ ...values, brand: event.target.value })} /></label>
        <label><HFieldLabel required>Modèle</HFieldLabel><HInput required maxLength={80} value={values.model} onChange={(event) => setValues({ ...values, model: event.target.value })} /></label>
        <label><HFieldLabel required>Immatriculation</HFieldLabel><HInput required maxLength={30} value={values.registration} onChange={(event) => setValues({ ...values, registration: event.target.value.toUpperCase() })} /></label>
        <label><HFieldLabel required>Employé</HFieldLabel><HCombobox showCodes={false} label="Employé du véhicule" required value={values.employee} options={employeeOptions} onChange={(value) => setValues({ ...values, employee: value })} /></label>
      </fieldset>
      <label className="h-choice"><input type="checkbox" disabled={save.isPending} checked={values.active} onChange={(event) => setValues({ ...values, active: event.target.checked })} />Actif</label>
      {save.error && <p role="alert" className="field-error">{save.error.message}</p>}
      <HDialogFooter><HButton disabled={save.isPending} onClick={onClose}>Fermer</HButton></HDialogFooter>
    </form>
  </HDialog>
}
