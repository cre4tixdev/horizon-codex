import { Settings } from 'lucide-react'
import { HButton } from '../../../shared/ui/HButton'
export function SettingsEditButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <HButton variant="ghost" size="icon" aria-label={`Modifier ${label}`} title={`Configurer ${label}`} onClick={onClick}><Settings size={16} /></HButton>
}
