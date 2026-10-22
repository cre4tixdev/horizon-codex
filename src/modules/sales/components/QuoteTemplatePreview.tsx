import { HDataTable } from '../../../shared/ui/HDataTable'
import { formatAmount } from '../../../shared/formatters/money'
import type { QuoteLineInput } from '../schemas/quotes'
export function QuoteTemplatePreview({ lines, currency, issues = [] }: { lines: QuoteLineInput[]; currency: string; issues?: { line: number; message: string }[] }) {
  return <HDataTable data={lines} columnBorders columnAlignments={{ quantity: 'right', price: 'right' }} columnClasses={{ description: 'quote-template-description-cell' }} columns={[
    { id: 'position', header: '#', cell: ({ row }) => row.index + 1, size: 40 },
    { id: 'description', header: 'Description', cell: ({ row }) => <><span className={row.original.kit_parent ? 'quote-template-kit-component' : ['section', 'subsection', 'subsection3'].includes(row.original.kind) ? 'quote-template-section' : undefined} data-kit-last={row.original.kit_parent ? lines[row.index + 1]?.kit_parent !== row.original.kit_parent : undefined}>{row.original.description || '—'}</span>{issues.filter((issue) => issue.line === row.index + 1).map((issue) => <small key={issue.message} className="field-error quote-cost-hint">{issue.message}</small>)}</> },
    { id: 'quantity', header: 'Qté', cell: ({ row }) => row.original.kind === 'item' ? `${row.original.quantity.toLocaleString('fr-FR')} ${row.original.unit}` : '', size: 80 },
    { id: 'price', header: 'PU HT', cell: ({ row }) => row.original.kind === 'item' && !row.original.kit_parent ? formatAmount(row.original.unit_price, currency) : '', size: 110 },
    { id: 'rule', header: 'Règle de prix', cell: ({ row }) => row.original.kit_parent ? 'Inclus dans le kit' : row.original.kind === 'item' ? row.original.price_source === 'margin' ? `Marge ${row.original.margin_percent.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %` : 'Prix fixe' : '', size: 110 },
  ]} />
}
