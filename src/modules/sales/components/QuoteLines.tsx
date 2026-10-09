import { QuoteProductPicker, AddProductButton } from './QuoteProductPicker'
import { useCatalogAccess } from '../../inventory'
import { useEffect, useRef, useState, type ReactNode, type RefCallback } from 'react'
import { useFieldArray, useWatch, type UseFormReturn } from 'react-hook-form'
import { DragDropProvider, DragOverlay, PointerSensor, KeyboardSensor } from '@dnd-kit/react'
import { isSortable, useSortable } from '@dnd-kit/react/sortable'
import { PointerActivationConstraints } from '@dnd-kit/dom'
import { ChevronDown, ChevronRight, Copy, GripVertical, Plus, Sigma, Trash2, ChevronsDownUp, ChevronsUpDown, Layers, FileText, Package } from 'lucide-react'
import { HButton } from '../../../shared/ui/HButton'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HInput } from '../../../shared/ui/HInput'
import { HAmountInput } from '../../../shared/ui/HAmountInput'
import { HRecordConfirmation } from '../../../shared/ui/HRecordConfirmation'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { formatAmount, currencySymbol } from '../../../shared/formatters/money'
import { emptyQuoteLine, quoteColumns, type QuoteInput, type SalesSettings } from '../schemas/quotes'
import { useQuoteColumns } from '../hooks/useQuoteColumns'
import { quoteVisibleIndices, quoteSectionEnd } from '../services/quoteColumns'
import { quotePreview } from '../services/quotePreview'
function Description({ value, onChange, label, name, inputRef }: { value: string; onChange: (value: string) => void; label: string; name: string; inputRef: RefCallback<HTMLTextAreaElement> }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const resize = () => { node.style.height = 'auto'; node.style.height = `${node.scrollHeight + 2}px` }
    resize()
    let lastWidth = node.clientWidth
    let frame = 0
    const observer = new ResizeObserver(() => { if (node.clientWidth !== lastWidth) { lastWidth = node.clientWidth; cancelAnimationFrame(frame); frame = requestAnimationFrame(resize) } }); observer.observe(node)
    return () => { observer.disconnect(); cancelAnimationFrame(frame) }
  }, [value])
  return <textarea name={name} ref={(node) => { ref.current = node; inputRef(node) }} className="h-input quote-line-description" aria-label={label} rows={1} maxLength={2000} required value={value} onChange={(event) => onChange(event.target.value)} />
}
function ColumnCaption({ name, label, currency }: { name: string; label: string; currency: string }) {
  const suffix = ['unit_cost', 'unit_price', 'line_total'].includes(name) ? currencySymbol(currency) : ['margin_percent', 'discount'].includes(name) ? '%' : ''
  return <span className="quote-column-caption">{name === 'unit' ? 'u.' : suffix ? label.replace(' %', '') : label}{suffix && <small>{suffix}</small>}</span>
}
const sensors = [PointerSensor.configure({ activationConstraints: (event) => event.pointerType === 'touch' ? [new PointerActivationConstraints.Delay({ value: 200, tolerance: 5 })] : [new PointerActivationConstraints.Distance({ value: 5 })] }), KeyboardSensor]
function SortableRow({ id, index, disabled, className, children }: { id: string; index: number; disabled: boolean; className: string; children: (handle: (element: Element | null) => void) => ReactNode }) {
  const { ref, handleRef, isDragSource } = useSortable({ id, index, group: 'quote-lines', disabled, transition: matchMedia('(prefers-reduced-motion: reduce)').matches ? null : { duration: 180, easing: 'ease-out' } })
  return <tr ref={ref} className={className} data-dragging={isDragSource}>{children(handleRef)}</tr>
}
export function QuoteLines({ form, editable, currency, settings, taxRate, recordTerms }: { recordTerms?: { id: string; label: string; content: string } | undefined; taxRate: number; form: UseFormReturn<QuoteInput>; editable: boolean; currency: string; settings: SalesSettings }) {
  const catalogAccess = useCatalogAccess()
  const [productIndex, setProductIndex] = useState<number>()
  const array = useFieldArray({ control: form.control, name: 'lines' })
  const values = useWatch({ control: form.control, name: 'lines' })
  const duplicateButton = useRef<HTMLButtonElement>(null)
  const termsId = useWatch({ control: form.control, name: 'terms_id' })
  const selectedTerms = recordTerms?.id && recordTerms.id === termsId ? recordTerms : settings.terms.find((term) => term.id === termsId)
  const termsOptions = settings.terms.filter((term) => term.active || term.id === termsId).map((term) => ({ value: term.id, label: term.label }))
  if (termsId && !termsOptions.some((term) => term.value === termsId) && selectedTerms) termsOptions.push({ value: termsId, label: selectedTerms.label })
  const discountMode = useWatch({ control: form.control, name: 'discount_mode' })
  const discount = useWatch({ control: form.control, name: 'discount' })
  const preview = quotePreview(array.fields.map((field, index) => form.getValues(`lines.${index}`) || values[index] || field), discount, discountMode)
  const [discountVisible, setDiscountVisible] = useState(discount > 0)
  const [duplicating, setDuplicating] = useState<string>()
  const duplicateIndex = array.fields.findIndex((line) => line.id === duplicating)
  const duplicateEnd = duplicateIndex < 0 ? 0 : quoteSectionEnd(values.map((line) => line.kind), duplicateIndex)
  const duplicateCount = duplicateEnd - duplicateIndex
  const duplicate = (includeContent: boolean) => {
    if (duplicateIndex < 0) return
    const current = form.getValues('lines')
    const end = includeContent ? quoteSectionEnd(current.map((line) => line.kind), duplicateIndex) : duplicateIndex + 1
    const copies = current.slice(duplicateIndex, end).map((line) => ({ ...line }))
    if (current.length + copies.length > 200) return
    array.insert(end, copies, { shouldFocus: false })
    setDuplicating(undefined)
  }
  const [deleting, setDeleting] = useState<string>()
  const deletionIndex = array.fields.findIndex((line) => line.id === deleting)
  const { containerRef, width, start, move, end, keyboard } = useQuoteColumns(settings)
  const [folded, setFolded] = useState<Set<string>>(() => new Set())
  const visible = new Set(quoteVisibleIndices(preview.lines.map((line) => line.kind), array.fields.map((field) => field.id), folded))
  const tax = preview.lines.filter((line) => !line.is_option).reduce((sum, line) => sum + Math.round(Math.round(line.tax_base * 100) * (taxRate || 0) / 100), 0) / 100
  const totalWidth = quoteColumns.reduce((sum, [key, , fallback]) => sum + width(key, fallback), 0)
  return <section className="sales-quote-lines"><HSectionHeading title="Lignes du devis" count={array.fields.length} />
    <DragDropProvider sensors={sensors} onDragEnd={(event) => {
      const source = event.operation.source
      if (event.canceled || !editable || !source || !isSortable(source)) return
      const from = array.fields.findIndex((field) => field.id === source.id)
      if (from >= 0 && source.index >= 0 && source.index < array.fields.length && from !== source.index) array.move(from, source.index)
    }}>
    <div ref={containerRef} className="data-table-scroll quote-grid-scroll"><table className="h-data-table quote-edit-table" style={{ width: '100%', minWidth: totalWidth }}><colgroup>{quoteColumns.map(([key, , fallback]) => <col key={key} style={{ width: width(key, fallback) }} />)}</colgroup><thead><tr>{quoteColumns.map(([key, label]) => <th key={key} aria-label={label} title={key === 'unit_cost' ? 'Coût unitaire HT' : key === 'unit_price' ? 'Prix unitaire de vente HT' : key === 'line_total' ? 'Prix total de vente HT après remise' : undefined}><span className={key === 'description' ? 'quote-description-header' : undefined}>{key === 'description' && <HButton variant="ghost" size="icon" disabled={!values.some((line) => ['section', 'subsection', 'subsection3'].includes(line.kind))} title={folded.size ? 'Déplier toutes les sections' : 'Replier toutes les sections'} aria-label={folded.size ? 'Déplier toutes les sections' : 'Replier toutes les sections'} onClick={() => setFolded(folded.size ? new Set() : new Set(array.fields.filter((field, index) => ['section', 'subsection', 'subsection3'].includes(values[index]?.kind || field.kind)).map((field) => field.id)))}>{folded.size ? <ChevronsUpDown size={14} /> : <ChevronsDownUp size={14} />}</HButton>}<ColumnCaption name={key} label={label} currency={currency} /></span><button type="button" className="quote-column-resizer" aria-label={`Redimensionner ${label}`} title="Glisser pour ajuster la largeur" onPointerDown={(event) => start(event, key)} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onKeyDown={(event) => keyboard(event, key, event.currentTarget.closest('th')!.getBoundingClientRect().width)} /></th>)}</tr></thead><tbody>{array.fields.map((field, index) => {
      if (!visible.has(index)) return null
      const line = preview.lines[index]!, item = line.kind === 'item', section = ['section', 'subsection', 'subsection3'].includes(line.kind)
      return <SortableRow key={field.id} id={field.id} index={index} disabled={!editable || folded.size > 0} className={`quote-row quote-row--${line.kind}${line.is_option ? ' quote-row--option' : ''}`}>{(handleRef) => <>
        <td className="quote-line-number"><div className="quote-position">{editable && <HButton ref={handleRef} variant="ghost" size="icon" className="quote-drag-handle" aria-label={`Déplacer ligne ${index + 1}`} title="Glisser pour déplacer la ligne"><GripVertical size={13} /></HButton>}<span>{index + 1}</span></div></td>
        <td><div className="quote-description-cell">{item && editable && catalogAccess.canRead && <HButton variant="ghost" size="icon" data-product-linked={Boolean(line.product)} title={line.product ? "Changer le produit" : "Choisir un produit"} aria-label={`Choisir un produit ligne ${index + 1}`} onClick={() => setProductIndex(index)}><Package size={13} /></HButton>}{section && <HButton variant="ghost" size="icon" className="quote-section-fold" title={folded.has(field.id) ? 'Déplier la section' : 'Replier la section'} aria-label={`${folded.has(field.id) ? 'Déplier' : 'Replier'} la section ${index + 1}`} aria-expanded={!folded.has(field.id)} onClick={() => setFolded((current) => { const next = new Set(current); if (next.has(field.id)) next.delete(field.id); else next.add(field.id); return next })}>{folded.has(field.id) ? <ChevronRight size={13} /> : <ChevronDown size={13} />}</HButton>}<Description name={`lines.${index}.description`} inputRef={form.register(`lines.${index}.description`).ref} label={`Description ligne ${index + 1}`} value={line.description} onChange={(value) => form.setValue(`lines.${index}.description`, value, { shouldDirty: true })} /></div></td>
        {!item && (section ? quoteColumns.slice(2, 10).map(([key]) => <td key={key} />) : <td colSpan={8} />)}
        {item && <><td className="quote-text-cell"><HInput maxLength={160} aria-label={`Marque ligne ${index + 1}`} {...form.register(`lines.${index}.brand`)} /></td><td className="quote-text-cell"><HInput maxLength={160} aria-label={`Référence ligne ${index + 1}`} {...form.register(`lines.${index}.reference`)} /></td>
          <td><HInput required type="number" min="0.001" max="1000000" step="any" aria-label={`Quantité ligne ${index + 1}`} {...form.register(`lines.${index}.quantity`, { valueAsNumber: true })} /></td><td className="quote-unit-cell"><HCombobox label={`Unité ligne ${index + 1}`} value={line.unit} options={[...settings.units.filter((unit) => unit.active || unit.code === line.unit).map((unit) => ({ value: unit.code, label: `${unit.code} · ${unit.label}`, displayLabel: unit.code })), ...(!settings.units.some((unit) => unit.code === line.unit) && line.unit ? [{ value: line.unit, label: line.unit }] : [])]} showCodes={false} clearable={false} disabled={!editable} onChange={(unit) => form.setValue(`lines.${index}.unit`, unit, { shouldDirty: true })} /></td>
          <td><HAmountInput inlineCurrency unitPrecision aria-label={`Coût ligne ${index + 1}`} currency={currency} value={line.unit_cost} onChange={(value) => form.setValue(`lines.${index}.unit_cost`, value, { shouldDirty: true })} /></td>
          <td><HInput type="number" min={-100} max={10000000000000} step="any" disabled={!editable || line.unit_cost <= 0} title="Taux sur coût avant remise : PUV = coût × (1 + marge / 100)" aria-label={`Marge ligne ${index + 1}`} value={Number.isFinite(line.margin_percent) ? Number(line.margin_percent.toFixed(2)) : ''} onChange={(event) => { form.setValue(`lines.${index}.margin_percent`, Number(event.target.value), { shouldDirty: true }); form.setValue(`lines.${index}.price_source`, 'margin', { shouldDirty: true }) }} /></td>
          <td><HAmountInput inlineCurrency unitPrecision aria-label={`Prix unitaire ligne ${index + 1}`} currency={currency} value={line.unit_price} onChange={(value) => { form.setValue(`lines.${index}.unit_price`, value, { shouldDirty: true }); form.setValue(`lines.${index}.price_source`, 'manual', { shouldDirty: true }) }} /></td>
          <td><HInput type="number" min={0} max={100} step="any" aria-label={`Remise ligne ${index + 1}`} {...form.register(`lines.${index}.discount`, { valueAsNumber: true })} /></td></>}
        <td className="quote-line-total">{item ? formatAmount(line.line_total, currency) : section ? <div className="quote-section-price">{editable && <HButton variant="ghost" size="icon" className="quote-section-total-toggle" aria-label={`${line.show_total ? 'Masquer' : 'Afficher'} le total de la section ${index + 1}`} title={line.show_total ? 'Masquer le total de la section' : 'Afficher le total de la section'} aria-pressed={line.show_total} onClick={() => form.setValue(`lines.${index}.show_total`, !line.show_total, { shouldDirty: true })}><Sigma size={14} /></HButton>}<div className="quote-section-amount">{line.show_total && <strong className={line.is_option ? 'quote-option-amount' : undefined}>{line.is_option ? `(${formatAmount(line.section_options_total, currency)})` : formatAmount(line.section_total, currency)}</strong>}</div></div> : null}</td>
        <td className="quote-purchase-status" title="Le suivi de commande fournisseur sera relié au module Achats">{item ? '—' : ''}</td>
        <td className="quote-option-cell">{(item || section) && <input type="checkbox" aria-label={`Option ligne ${index + 1}`} title={line.optionInherited ? 'Option héritée du titre parent' : section ? 'Mettre le titre et tout son contenu en option' : 'Option : exclure du total principal'} checked={line.is_option} disabled={!editable || line.optionInherited} onChange={(event) => {
          const current = form.getValues('lines'), end = section ? quoteSectionEnd(current.map((line) => line.kind), index) : index + 1
          for (let child = index; child < end; child++) form.setValue(`lines.${child}.is_option`, event.target.checked, { shouldDirty: true })
        }} />}</td>
        <td className="quote-row-actions">{editable && <div className="quote-action-icons"><HButton variant="ghost" size="icon" aria-label={`Dupliquer ligne ${index + 1}`} title="Dupliquer la ligne" disabled={array.fields.length >= 200} onClick={(event) => { duplicateButton.current = event.currentTarget; if (section) setDuplicating(field.id); else array.insert(index + 1, { ...form.getValues(`lines.${index}`) }, { shouldFocus: false }) }}><Copy size={14} /></HButton><HButton variant="ghost" size="icon" aria-label={`Supprimer ligne ${index + 1}`} title="Supprimer la ligne" onClick={() => setDeleting(field.id)}><Trash2 size={14} /></HButton></div>}</td>
      </>}</SortableRow>

    })}</tbody></table></div>
    <DragOverlay className="quote-drag-preview" dropAnimation={matchMedia('(prefers-reduced-motion: reduce)').matches ? null : { duration: 180, easing: 'ease-out' }}>{(source) => {
      const index = array.fields.findIndex((field) => field.id === source.id), line = preview.lines[index]
      if (!line) return null
      return <div className="quote-drag-summary"><span>{index + 1}</span><strong>{line.description || 'Nouvelle ligne'}</strong>{line.kind === 'item' && <span>{formatAmount(line.line_total, currency)}</span>}</div>
    }}</DragOverlay></DragDropProvider>
    {editable && <div className="quote-line-toolbar quote-line-additions"><AddProductButton disabled={array.fields.length >= 200} onClick={() => setProductIndex(array.fields.length)} />{([['item', 'Ajouter une ligne'], ['section', 'Titre niveau 1'], ['subsection', 'Titre niveau 2'], ['subsection3', 'Titre niveau 3'], ['note', 'Note']] as const).map(([kind, label]) => <HButton key={kind} className={`quote-line-add--${kind}`} variant="ghost" size="small" disabled={array.fields.length >= 200} onClick={() => {
      const index = array.fields.length, kinds = [...form.getValues('lines').map((line) => line.kind), kind]
      setFolded((current) => new Set([...current].filter((id) => {
        const parent = array.fields.findIndex((field) => field.id === id)
        return parent < 0 || quoteSectionEnd(kinds, parent) <= index
      })))
      array.append(emptyQuoteLine(kind), { focusName: `lines.${index}.description` })
    }}><Plus size={13} />{label}</HButton>)}</div>}
    {!array.fields.length && <p className="contact-muted">Ajoutez un article, une section ou une note.</p>}
    <div className="quote-footer-layout"><section className="quote-terms"><HSectionHeading title="Conditions générales de vente" icon={FileText} /><HCombobox label="Conditions générales de vente" value={termsId} options={termsOptions} showCodes={false} disabled={!editable} onChange={(id) => form.setValue('terms_id', id, { shouldDirty: true })} /><div className="quote-terms-content">{selectedTerms?.content || <span className="contact-muted">Sélectionnez des conditions générales de vente.</span>}</div></section><div className="quote-summary">{discount > 0 && <div className="sales-quote-totals"><span>HT avant remise globale</span><strong>{formatAmount(preview.subtotal_before_discount, currency)}</strong></div>}<div className="sales-quote-totals quote-total-ht"><span>Total HT</span><strong>{formatAmount(preview.subtotal, currency)}</strong></div>{(discountVisible || discount > 0) ? <div className="sales-quote-totals quote-footer-discount">
        <span className="quote-discount-label">Remise globale{editable && <HButton className="quote-remove-discount" variant="ghost" size="icon" aria-label="Retirer la remise globale" title="Retirer la remise globale" onClick={() => { form.setValue('discount', 0, { shouldDirty: true }); form.setValue('discount_mode', 'percent', { shouldDirty: true }); setDiscountVisible(false) }}><Trash2 size={13} /></HButton>}</span>
        <div className="quote-discount-inputs">
          <label><HAmountInput currency={currency} inlineCurrency aria-label="Remise globale (montant)" disabled={!editable} value={preview.discount_amount} onChange={(value) => { form.setValue('discount_mode', 'amount', { shouldDirty: true }); form.setValue('discount', value, { shouldDirty: true }) }} /></label>
          <label><span className="quote-percent-input"><HInput aria-label="Remise globale (%)" type="number" min={0} max={100} step="any" disabled={!editable} value={discountMode === 'percent' ? discount : preview.subtotal_before_discount > 0 ? Number((preview.discount_amount / preview.subtotal_before_discount * 100).toFixed(4)) : 0} onChange={(event) => { form.setValue('discount_mode', 'percent', { shouldDirty: true }); form.setValue('discount', event.target.valueAsNumber, { shouldDirty: true }) }} /><span aria-hidden="true">%</span></span></label>
        </div>
      </div> : null}{editable && !discountVisible && !(discount > 0) && <HButton variant="ghost" size="small" className="quote-add-discount" onClick={() => setDiscountVisible(true)}><Plus size={13} />Ajouter une remise globale</HButton>}<div className="sales-quote-totals quote-total-tax"><span>TVA {taxRate} %</span><strong>{formatAmount(tax, currency)}</strong></div><div className="sales-quote-totals quote-total-ttc"><span>Total TTC</span><strong>{formatAmount((Math.round(preview.subtotal * 100) + Math.round(tax * 100)) / 100, currency)}</strong></div>{preview.lines.some((line) => line.is_option) && <div className="sales-quote-totals sales-quote-options-total"><span>Options HT</span><strong>{formatAmount(preview.options_total, currency)}</strong></div>}<div className="quote-profitability"><div className="sales-quote-totals quote-cost-total"><span>Total achats HT</span><strong>{formatAmount(preview.cost_total, currency)}</strong></div><div className="sales-quote-totals quote-margin-total"><span>Marge globale HT</span><strong>{formatAmount(preview.margin_amount, currency)}</strong></div><div className="sales-quote-totals quote-margin-percent"><span>Marge sur coût</span><strong>{preview.cost_total > 0 ? `${new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(preview.margin_percent)} %` : '—'}</strong></div></div></div></div>
    {productIndex !== undefined && <QuoteProductPicker initial={{ product: values[productIndex]?.product || '', product_supplier: values[productIndex]?.product_supplier || '' }} currency={currency} onClose={() => setProductIndex(undefined)} onChoose={(value) => { const previous = form.getValues(`lines.${productIndex}`); const line = { ...(previous || emptyQuoteLine()), ...value }; if (productIndex < array.fields.length) array.update(productIndex, line); else array.append(line, { focusName: `lines.${productIndex}.description` }); setFolded(new Set()) }} />}
    {duplicating && <HDialog className="quote-duplicate-dialog" open title="Dupliquer le titre" description={`« ${values[duplicateIndex]?.description || 'Titre'} »`} onCloseAutoFocus={(event) => { event.preventDefault(); duplicateButton.current?.focus() }} onOpenChange={(open) => { if (!open) setDuplicating(undefined) }}>
      <HDialogFooter><HButton className="quote-duplicate-choice" aria-label="Titre seul" onClick={() => duplicate(false)}><Copy size={18} /><span>Titre seul<small>Copier uniquement ce titre</small></span></HButton><HButton className="quote-duplicate-choice" aria-label="Titre et contenu" variant="primary" disabled={array.fields.length + duplicateCount > 200} onClick={() => duplicate(true)}><Layers size={18} /><span>Titre et contenu<small>{Math.max(0, duplicateCount - 1)} ligne(s) incluse(s)</small></span></HButton></HDialogFooter>
      {array.fields.length + duplicateCount > 200 && <p className="field-error">La copie complète dépasserait la limite de 200 lignes.</p>}
    </HDialog>}

    {deleting && <HRecordConfirmation requireText={false} action="delete" itemName={`la ligne ${deletionIndex + 1} : ${values[deletionIndex]?.description || 'sans description'}`} description="La ligne sera retirée du brouillon. Enregistrer appliquera ce retrait au devis ; les autres lignes de la section seront conservées." open onOpenChange={(open) => { if (!open) setDeleting(undefined) }} onConfirm={async () => { if (deletionIndex >= 0) array.remove(deletionIndex); setDeleting(undefined) }} />}
  </section>
}
