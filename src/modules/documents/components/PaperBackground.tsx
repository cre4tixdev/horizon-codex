import type { Layout } from '../schemas/templates'
/** Separate layer: opacity affects the backdrop, never the document content. */
export function PaperBackground({ value }: { value: Layout['background'] }) {
  return value ? <div aria-hidden="true" className="studio-paper-background" style={{ backgroundColor: value.color, opacity: value.opacity }}>{value.image && <img src={value.image} alt="" draggable={false} style={{ objectFit: value.fit }} />}</div> : null
}
