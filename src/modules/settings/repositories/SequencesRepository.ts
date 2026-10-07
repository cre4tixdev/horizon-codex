import { createPocketBaseClient } from '../../../core/pocketbase/client'
import { sequenceSchema, type NumberingSequence, type SequenceInput } from '../schemas/sequences'
export function createSequencesRepository(url: string) {
  const client = createPocketBaseClient(url)
  return {
    async list() { return sequenceSchema.array().parse(await client.collection('settings_numbering_sequences').getFullList({ sort: 'entity_type', requestKey: null })) },
    async save(record: NumberingSequence, input: SequenceInput) { return sequenceSchema.parse(await client.send('/api/horizon/settings/sequences/save', { method: 'POST', body: { id: record.id, updated: record.updated, expected_next_value: record.next_value, input } })) },
  }
}
