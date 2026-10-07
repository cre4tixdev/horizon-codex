import { hasPermission } from '../../../core/auth/types/session'
import { ClientResponseError } from 'pocketbase'
import { environment } from '../../../core/config/environment'
import { sessionService } from '../../../core/auth/services/session'
import { createSequencesRepository } from '../repositories/SequencesRepository'
import { sequenceInputSchema, type NumberingSequence, type SequenceInput } from '../schemas/sequences'
const repository = environment.pocketBaseUrl ? createSequencesRepository(environment.pocketBaseUrl) : undefined
function authorize() {
  const session = sessionService.getSnapshot()
  if (session.status !== 'authenticated' || !hasPermission(session.user, 'settings.references')) throw new Error('Accès aux séquences non autorisé.')
  if (!repository) throw new Error('Séquences non configurées.')
  return repository
}
export const sequencesService = {
  async list() {
    const source = authorize()
    try { return await source.list() } catch (error) { console.error('[settings] Sequences unavailable'); throw new Error('Séquences indisponibles. Vérifiez la migration et réessayez.', { cause: error }) }
  },
  async save(record: NumberingSequence, input: SequenceInput) {
    const source = authorize()
    const parsed = sequenceInputSchema.safeParse(input)
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || 'Séquence invalide.')
    if (record.has_issued && (input.start_value !== record.start_value || input.next_value < record.next_value)) throw new Error('Une séquence utilisée ne peut pas revenir en arrière ni changer de départ.')
    try { return await source.save(record, parsed.data) } catch (error) {
      console.error('[settings] Sequence save failed')
      throw new Error(error instanceof ClientResponseError && error.status === 409 ? 'La séquence a changé. Fermez cette fenêtre et actualisez la liste avant de réessayer.' : 'Séquence non enregistrée. Actualisez la liste et réessayez.', { cause: error })
    }
  },
}
