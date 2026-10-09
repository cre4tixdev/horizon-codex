import { useMutation, useQueryClient } from '@tanstack/react-query'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HButton } from '../../../shared/ui/HButton'
import { documentsService } from '../services/DocumentsService'
import type { TemplateChoice } from '../schemas/templates'

export function TemplateLifecycleDialog({ template, action, onClose }: { template: TemplateChoice; action: 'archive' | 'delete'; onClose: () => void }) {
  const client = useQueryClient()
  const mutation = useMutation({
    mutationFn: async () => {
      if (!template.updated) throw new Error('Rechargez la liste des modèles avant de continuer.')
      if (action === 'delete') return documentsService.delete(template.id, template.updated)
      return documentsService.archive(template.id, template.updated)
    },
    onSuccess: async () => {
      if (action === 'delete') client.removeQueries({ queryKey: ['documents', 'template', template.id] })
      else await client.invalidateQueries({ queryKey: ['documents', 'template', template.id] })
      await client.invalidateQueries({ queryKey: ['documents', 'choices'] })
      onClose()
    },
  })
  return <HDialog open title={action === 'delete' ? 'Supprimer le modèle' : 'Archiver le modèle'} description={action === 'delete' ? `Supprimer définitivement « ${template.name} » ?` : `Archiver « ${template.name} » ? Le modèle et ses versions seront conservés, mais ne seront plus proposés pour les nouveaux aperçus.`} onOpenChange={(open) => { if (!open && !mutation.isPending) onClose() }}>
    {mutation.error && <p role="alert" className="field-error">{mutation.error.message}</p>}
    <HDialogFooter><HButton disabled={mutation.isPending} onClick={() => mutation.mutate()}>{mutation.isPending ? 'En cours…' : action === 'delete' ? 'Supprimer' : 'Archiver'}</HButton></HDialogFooter>
  </HDialog>
}
