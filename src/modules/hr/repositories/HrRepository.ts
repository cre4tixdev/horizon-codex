import { createPocketBaseClient } from '../../../core/pocketbase/client'
import { employeeSchema, hrDirectorySchema, teamSchema, type Employee, type EmployeeInput, type Team } from '../schemas/employees'
export function createHrRepository(url: string) {
  const client = createPocketBaseClient(url)
  return {
    async directory() { return hrDirectorySchema.parse(await client.send('/api/horizon/hr/directory', { method: 'GET', requestKey: null })) },
    async save(input: EmployeeInput, record?: Employee, avatar?: File, removeAvatar = false) { const body = new FormData(); body.set('id', record?.id || ''); body.set('updated', record?.updated || ''); body.set('input', JSON.stringify(input)); body.set('remove_avatar', String(removeAvatar)); if (avatar) body.set('avatar', avatar); return employeeSchema.parse(await client.send('/api/horizon/hr/employees/save', { method: 'POST', body })) },
    async imageURL(record: Employee) { const token = await client.files.getToken({ requestKey: null }); return client.files.getURL({ collectionId: record.collectionId, id: record.id }, record.avatar, { token }) },
    async team(name: string, managers: string[], active: boolean, record?: Team) { return teamSchema.parse(await client.send('/api/horizon/hr/teams/save', { method: 'POST', body: { name, managers, active, id: record?.id || '', updated: record?.updated || '' } })) },
  }
}
