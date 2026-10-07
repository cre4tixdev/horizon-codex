import { useId, type CSSProperties } from 'react'
import { Plus } from 'lucide-react'
import { extraTagColors, tagTones, tagToneLabels, type TagTone } from '../schemas/tagTone'
export function HTonePicker({ label, value, onChange, disabled, color, onColorChange }: { label: string; value: TagTone; onChange: (tone: TagTone) => void; disabled?: boolean; color?: string | undefined; onColorChange?: (color: string) => void }) {
  const id = useId()
  const custom = Boolean(color && !extraTagColors.some((swatch) => swatch.color.toLowerCase() === color.toLowerCase()))
  return <fieldset className="h-tone-picker" disabled={disabled}><legend>{label}</legend><div>
    {tagTones.map((tone) => <label className="h-tone" data-tone={tone} title={tagToneLabels[tone]} key={tone}><input type="radio" name={id} aria-label={tagToneLabels[tone]} value={tone} checked={!color && value === tone} onChange={() => { onColorChange?.(''); onChange(tone) }} /><span /></label>)}
    {onColorChange && extraTagColors.map((swatch) => <label title={swatch.label} key={swatch.color} style={{ '--tag-color': swatch.color } as CSSProperties}><input type="radio" name={id} aria-label={swatch.label} value={swatch.color} checked={color?.toLowerCase() === swatch.color.toLowerCase()} onChange={() => onColorChange(swatch.color)} /><span /></label>)}
    {onColorChange && <label className="h-custom-color" data-selected={custom} title={`Couleur personnalisée${custom ? ` · ${color}` : ''}`} style={custom ? { '--tag-color': color } as CSSProperties : undefined}><input type="color" aria-label="Couleur personnalisée" value={color || '#7b3fc7'} onChange={(event) => onColorChange(event.target.value)} /><span><Plus size={14} aria-hidden="true" /></span></label>}
  </div></fieldset>
}
