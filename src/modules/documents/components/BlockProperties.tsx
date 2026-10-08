import { backgroundColor } from './textStyle'
import { StudioSection } from './StudioSection'
import { HColorField } from '../../../shared/ui/HColorField'
import { OpacityControl } from './OpacityControl'
import { HInput } from '../../../shared/ui/HInput'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HRichTextEditor } from '../../../shared/ui/HRichTextEditor'
import { HButton } from '../../../shared/ui/HButton'
import { useId, useRef, useState, type ReactNode, type CSSProperties } from 'react'
import { ArrowUp, ArrowDown, Bold, Italic, CaseUpper, PanelBottom, AlignLeft, AlignCenter, AlignRight, ImagePlus, X, Link, Unlink } from 'lucide-react'
import { bindingLabels, bindingGroups, fonts, columnLabels, fitImage, resizeBlock, resizeColumns, type Block, type TextStyle } from '../schemas/templates'
export function StyleProperties({ value, onChange, richText = false, collapsible = true }: { collapsible?: boolean; richText?: boolean; value: TextStyle; onChange: (value: TextStyle) => void }) {
  const controls = <>
    <div className="studio-font-grid">
      <label>Police<HCombobox label="Police du texte" required clearable={false} showCodes={false} value={value.font} options={fonts.map((font) => ({ value: font, label: font }))} onChange={(font) => { const selected = fonts.find((item) => item === font); if (selected) onChange({ ...value, font: selected }) }} /></label>
      <label>Taille · px<HInput aria-label="Taille du texte (px)" type="number" min={8} max={48} value={value.size} onChange={(event) => onChange({ ...value, size: Number(event.target.value) })} /></label>
    </div>
    <div className="studio-format-tools">
      <div className="studio-text-tools" role="group" aria-label="Style du texte">
        {([{ key: 'bold', label: 'Gras', icon: Bold }, { key: 'italic', label: 'Italique', icon: Italic }, { key: 'uppercase', label: 'Majuscules', icon: CaseUpper }, { key: 'border', label: 'Trait sous le bloc', icon: PanelBottom }] as const).filter((tool) => !richText || !['bold', 'italic'].includes(tool.key)).map(({ key, label, icon: Icon }) => <HButton key={key} size="icon" variant="ghost" title={label} aria-label={label} aria-pressed={value[key]} onClick={() => onChange({ ...value, [key]: !value[key] })}><Icon size={14} /></HButton>)}
      </div>
      <div className="studio-text-tools" role="group" aria-label="Alignement du texte">{([{ align: 'left', label: 'Aligner le texte à gauche', icon: AlignLeft }, { align: 'center', label: 'Centrer le texte', icon: AlignCenter }, { align: 'right', label: 'Aligner le texte à droite', icon: AlignRight }] as const).map(({ align, label, icon: Icon }) => <HButton key={align} size="icon" variant="ghost" title={label} aria-label={label} aria-pressed={value.align === align} onClick={() => onChange({ ...value, align })}><Icon size={14} /></HButton>)}</div>
    </div>
    <div className="studio-color-row"><HColorField caption="Texte" label="Couleur du texte" value={value.color} onChange={(color) => onChange({ ...value, color })} /><HColorField caption="Fond du bloc" label="Couleur du fond du bloc" value={value.background} onChange={(background) => onChange({ ...value, background })} /></div>
    <OpacityControl label="Opacité du fond" value={value.backgroundOpacity ?? 1} onChange={(backgroundOpacity) => onChange({ ...value, backgroundOpacity })} />
  </>
  return collapsible ? <StudioSection id="appearance" title="Apparence">{controls}</StudioSection> : <div className="studio-style-controls">{controls}</div>
}

export function BlockProperties({ block, maxWidth, maxHeight, headings, moving, onChange, onError, disabled, placement }: { placement: ReactNode; disabled: boolean; maxWidth: number; maxHeight: number; headings: TextStyle[]; block: Block; moving: boolean; onChange: (value: Block) => void; onError: (message: string) => void }) {
  const imageInput = useRef<HTMLInputElement>(null), imageId = useId(), [headingLevel, setHeadingLevel] = useState(0)
  const group = block.field.split('.')[0]
  const editorStyle: CSSProperties & Record<string, string | number | undefined> = { '--studio-font': block.style.font, '--studio-size': `${block.style.size}px`, '--studio-color': block.style.color, '--studio-align': block.style.align, '--studio-weight': block.style.bold ? 600 : 400, '--studio-italic': block.style.italic ? 'italic' : 'normal' }
  headings.forEach((heading, i) => { for (const [key, value] of Object.entries(heading)) editorStyle[`--studio-h${i + 1}-${key}`] = key === 'size' ? `${value}px` : key === 'bold' ? value ? 600 : 400 : key === 'italic' ? value ? 'italic' : 'normal' : String(value) })
  headings.forEach((heading, i) => { editorStyle[`--studio-h${i + 1}-background`] = backgroundColor(heading.background, heading.backgroundOpacity) })
  return <>
    {block.kind === 'image' && <StudioSection id="image" title="Image"><div className="studio-image-upload">
      {block.image ? <img src={block.image} alt="Logo importé" onLoad={(event) => { if (block.imageRatio || disabled) return; const image = event.currentTarget, ratio = image.naturalWidth / image.naturalHeight; if (!image.naturalWidth || !image.naturalHeight || ratio < 0.0001 || ratio > 10000) return; const fitted = fitImage(block, image.naturalWidth, image.naturalHeight, block.width, Math.min(maxHeight, block.height || 60)); if (fitted.height > maxHeight) return; const offset = block.style.align === 'right' ? block.width - fitted.width : block.style.align === 'center' ? (block.width - fitted.width) / 2 : 0; onChange({ ...fitted, x: block.x + offset }) }} /> : <ImagePlus size={30} />}
      <HButton size="small" onClick={() => imageInput.current?.click()}><ImagePlus size={14} />{block.image ? 'Remplacer le logo' : 'Importer un logo'}</HButton>
      {block.image && <HButton size="icon" variant="ghost" title="Retirer le logo" aria-label="Retirer le logo" onClick={() => onChange({ ...block, image: '' })}><X size={14} /></HButton>}
      <small>PNG, JPEG ou WebP · 1 Mo max.</small>
      <input ref={imageInput} id={imageId} aria-label="Fichier du logo" type="file" accept="image/png,image/jpeg,image/webp" className="studio-file-input" onChange={(event) => {
        const file = event.target.files?.[0]; if (!file) return
        if (file.size > 1000000 || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { onError('Choisissez une image PNG, JPEG ou WebP de moins de 1 Mo.'); return }
        const reader = new FileReader(); reader.onload = () => { if (typeof reader.result !== 'string') return; const source = reader.result, image = new window.Image(); image.onload = () => { if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth / image.naturalHeight < 0.0001 || image.naturalWidth / image.naturalHeight > 10000) { onError('Les dimensions de cette image ne sont pas prises en charge.'); return }; if (maxWidth < 20 || maxHeight * image.naturalWidth / image.naturalHeight < 20) { onError('Cette image ne tient pas dans la zone. Agrandissez la zone ou déplacez le bloc.'); return }; onChange(fitImage({ ...block, image: source }, image.naturalWidth, image.naturalHeight, maxWidth, maxHeight)) }; image.onerror = () => onError('Cette image n’a pas pu être décodée.'); image.src = source };  reader.onerror = () => onError('L’image n’a pas pu être lue.'); reader.readAsDataURL(file); event.target.value = ''
      }} />
    </div></StudioSection>}
    {block.kind === 'field' && <StudioSection id="binding" title="Valeur liée"><div className="studio-binding-fields">
      <label>Provenance<HCombobox label="Provenance du champ" required clearable={false} showCodes={false} value={group ?? ''} options={Object.entries(bindingGroups).map(([value, label]) => ({ value, label }))} onChange={(next) => { const field = Object.keys(bindingLabels).find((key) => key.startsWith(`${next}.`)); if (field) onChange({ ...block, field: field as Block['field'] }) }} /></label>
      <label>Champ<HCombobox label="Champ lié" required clearable={false} showCodes={false} value={block.field} options={Object.entries(bindingLabels).filter(([field]) => field.startsWith(`${group}.`)).map(([value, label]) => ({ value, label }))} onChange={(field) => { if (field in bindingLabels) onChange({ ...block, field: field as Block['field'] }) }} /></label>
      </div><label>Texte avant la valeur<HInput placeholder="Ex. Valable jusqu’au " value={block.text} onChange={(event) => onChange({ ...block, text: event.target.value })} /></label>
    </StudioSection>}
    {block.kind === 'text' && <><StudioSection id="text-content" title="Contenu"><div className="studio-rich-editor" style={editorStyle}><HRichTextEditor disabled={disabled} label="Texte du bloc" value={block.content} text={block.text} onChange={(content, text) => onChange({ ...block, content, text })} /></div></StudioSection></>}
    {block.kind === 'table' && <StudioSection id="table-data" title="Données du tableau">
      <div className="studio-table-source"><label>Source<HCombobox label="Source du tableau" value={block.tableSource || 'sales.quote_lines'} required clearable={false} showCodes={false} options={[{ value: 'sales.quote_lines', label: 'Ventes · Lignes du devis' }]} onChange={() => onChange({ ...block, tableSource: 'sales.quote_lines' })} /></label><p>Contenu du devis choisi pour l’aperçu.</p></div>
      <div className="studio-column-fields">
        <div className="studio-column-heading" aria-hidden="true"><span /><span>Nom</span><span>Largeur %</span><span>Ordre</span></div>
        {[...block.columns.map((column) => column.field), ...Object.keys(columnLabels).filter((field) => !block.columns.some((column) => column.field === field))].map((field) => {
          const label = columnLabels[field as keyof typeof columnLabels], column = block.columns.find((item) => item.field === field)
          return <div className="studio-column-row" key={field} data-active={Boolean(column)}>
            <input aria-label={label} title={field === 'description' ? 'Description obligatoire' : `Afficher ${label}`} type="checkbox" disabled={field === 'description'} checked={Boolean(column)} onChange={(event) => onChange({ ...block, columns: event.target.checked ? resizeColumns([...block.columns, { field: field as Block['columns'][number]['field'], label, width: 10 }], field as Block['columns'][number]['field'], 10) : resizeColumns(block.columns.filter((item) => item.field !== field), 'description', (block.columns.find((item) => item.field === 'description')?.width || 0) + (column?.width || 0)) })} />
            {column ? <HInput aria-label={`Libellé ${label}`} value={column.label} onChange={(event) => onChange({ ...block, columns: block.columns.map((item) => item.field === field ? { ...item, label: event.target.value } : item) })} /> : <span className="studio-column-name">{label}</span>}
            {column ? <HInput aria-label={`Largeur ${label}`} type="number" step={0.01} min={3} max={100} value={Math.round(column.width * 100) / 100} onChange={(event) => onChange({ ...block, columns: resizeColumns(block.columns, field as Block['columns'][number]['field'], Number(event.target.value)) })} /> : <span className="studio-column-empty">—</span>}
            <div className="studio-column-order">{[-1, 1].map((delta) => <HButton key={delta} size="icon" variant="ghost" title={delta < 0 ? `Monter ${label}` : `Descendre ${label}`} aria-label={`${delta < 0 ? 'Avancer' : 'Reculer'} ${label}`} disabled={!column || block.columns.indexOf(column) + delta < 0 || block.columns.indexOf(column) + delta >= block.columns.length} onClick={() => { if (!column) return; const columns = [...block.columns], index = columns.indexOf(column); columns.splice(index + delta, 0, columns.splice(index, 1)[0]!); onChange({ ...block, columns }) }}>{delta < 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}</HButton>)}</div>
          </div>
        })}
        <div className="studio-column-total"><span>Largeur totale</span><span className={Math.abs(block.columns.reduce((sum, column) => sum + column.width, 0) - 100) > 0.1 ? 'field-error' : ''}>{Math.round(block.columns.reduce((sum, column) => sum + column.width, 0) * 100) / 100} %</span></div>
      </div>
    </StudioSection>}
    {block.kind === 'table' && <StudioSection id="table-headings" title="Titres des lignes"><p className="contact-muted">Sections des lignes du devis · styles propres à ce tableau.</p><div className="studio-heading-levels" role="group" aria-label="Niveau de titre">{[0, 1, 2].map((index) => <HButton key={index} size="small" variant="ghost" aria-pressed={headingLevel === index} onClick={() => setHeadingLevel(index)}>Titre {index + 1}</HButton>)}</div><StyleProperties collapsible={false} value={(block.tableHeadings || headings)[headingLevel]!} onChange={(style) => onChange({ ...block, tableHeadings: (block.tableHeadings || headings).map((item, i) => i === headingLevel ? style : item) })} /></StudioSection>}
    {placement}
    <StudioSection id="geometry" title="Position et dimensions"><div className="studio-properties-fields" data-moving={moving}>{(['x', 'y', 'width', 'height'] as const).map((key) => <label key={key}>{{ x: 'X · px', y: block.zone === 'body' ? 'Espace avant · px' : 'Y · px', width: 'Largeur · px', height: 'Hauteur min. · px' }[key]}<HInput type="number" step={0.01} min={key === 'width' ? 20 : 0} aria-label={{ x: 'X (px)', y: block.zone === 'body' ? 'Espace avant (px)' : 'Y (px)', width: 'Largeur (px)', height: 'Hauteur min. (px)' }[key]} value={block[key]} onChange={(event) => onChange(key === 'width' || key === 'height' ? resizeBlock(block, key === 'width' ? Number(event.target.value) : block.width, key === 'height' ? Number(event.target.value) : block.height, maxWidth, maxHeight, key) : { ...block, [key]: Number(event.target.value), ...(key === 'x' ? { anchorX: undefined } : { anchorY: undefined }) })} /></label>)}</div>
    {block.kind === 'image' && block.imageRatio && <HButton className="studio-aspect-toggle" size="small" variant="ghost" aria-pressed={block.lockAspect !== false} onClick={() => onChange({ ...block, lockAspect: block.lockAspect === false })}>{block.lockAspect === false ? <Unlink size={13} /> : <Link size={13} />}Conserver les proportions</HButton>}</StudioSection>
    <StyleProperties richText={block.kind === 'text'} value={block.style} onChange={(style) => onChange({ ...block, style })} />
  </>
}
