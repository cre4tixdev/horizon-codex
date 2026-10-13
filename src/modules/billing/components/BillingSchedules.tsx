import type { ReactNode } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { HInput } from '../../../shared/ui/HInput'
import { HAmountInput } from '../../../shared/ui/HAmountInput'
import { HButton } from '../../../shared/ui/HButton'
type Schedule = { due_date: string; amount: number }
type Row = { cells: ReactNode[] }
const columns: ColumnDef<Row>[] = ['Date', 'Montant', 'Actions'].map((header, index) => ({ id: String(index), header, cell: ({ row }) => row.original.cells[index] }))
export function BillingSchedules({ schedules, editable, onChange, onDueDate }: { schedules: Schedule[]; editable: boolean; onChange: (values: Schedule[]) => void; onDueDate: (date: string) => void }) {
  const rows: Row[] = schedules.map((item, index) => ({ cells: [
    <HInput aria-label={`Date échéance ${index + 1}`} type="date" disabled={!editable} value={item.due_date} onChange={(event) => schedules.length === 1 ? onDueDate(event.target.value) : onChange(schedules.map((row, i) => i === index ? { ...row, due_date: event.target.value } : row))} />,
    <HAmountInput aria-label={`Montant échéance ${index + 1}`} inlineCurrency currency="EUR" disabled={!editable || schedules.length === 1} value={item.amount} onChange={(amount) => onChange(schedules.map((row, i) => i === index ? { ...row, amount } : row))} />,
    editable && schedules.length > 1 && <HButton size="small" onClick={() => onChange(schedules.filter((_, i) => i !== index))}>Retirer</HButton>,
  ] }))
  return <HDataTable columnBorders data={rows} columns={columns} />
}
