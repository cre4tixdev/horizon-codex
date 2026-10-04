import { z } from 'zod'
import { createPocketBaseClient } from '../../../core/pocketbase/client'
import { addressSchema, companySchema, personSchema, roleSchema } from '../schemas/contacts'
import type { AddressInput, CompanyInput, ContactFiles, ListOptions, PersonInput } from '../types/contacts'

export function createContactsRepository(url: string) {
  const client = createPocketBaseClient(url)
  const pageSchema = <T>(schema: z.ZodType<T>) => z.object({ items: z.array(schema), totalPages: z.number(), totalItems: z.number() })
  const sort = (options: ListOptions, allowed: string[], fallback: string) => `${options.descending ? '-' : ''}${options.sort && allowed.includes(options.sort) ? options.sort : fallback},id`
  const filter = (options: ListOptions, fields: string[]) => client.filter(`active = {:active} && (${fields.map((field) => `${field} ~ {:search}`).join(' || ')})`, { active: !options.archived, search: options.search })
  function data(input: CompanyInput | PersonInput, files: ContactFiles, imageField: 'logo' | 'avatar') {
    const result = new FormData()
    for (const [key, value] of Object.entries(input)) result.set(key, value)
    if (files.image) result.set(imageField, files.image)
    else if (files.removeImage) result.set(imageField, '')
    for (const file of files.gallery ?? []) result.append('images+', file)
    return result
  }
  return {
    async companies(options: ListOptions) { return pageSchema(companySchema).parse(await client.collection('contacts_companies').getList(options.page, 25, { filter: filter(options, ['name', 'legal_name', 'email']), sort: sort(options, ['name', 'email', 'legal_name'], 'name'), expand: 'contacts_company_roles_via_company', requestKey: null })) },
    async people(options: ListOptions) { return pageSchema(personSchema).parse(await client.collection('contacts_people').getList(options.page, 25, { filter: filter(options, ['first_name', 'last_name', 'email', 'company.name']), sort: sort(options, ['last_name', 'email'], 'last_name'), expand: 'company', requestKey: null })) },
    async company(id: string) { return companySchema.parse(await client.collection('contacts_companies').getOne(id, { expand: 'contacts_company_roles_via_company', requestKey: null })) },
    async person(id: string) { return personSchema.parse(await client.collection('contacts_people').getOne(id, { expand: 'company', requestKey: null })) },
    async saveCompany(input: CompanyInput, files: ContactFiles, id?: string) {
      const body = data(input, files, 'logo')
      if (!id) body.set('active', 'true')
      return companySchema.parse(id ? await client.collection('contacts_companies').update(id, body) : await client.collection('contacts_companies').create(body))
    },
    async savePerson(input: PersonInput, files: ContactFiles, id?: string) {
      const body = data(input, files, 'avatar')
      if (!id) body.set('active', 'true')
      return personSchema.parse(id ? await client.collection('contacts_people').update(id, body) : await client.collection('contacts_people').create(body))
    },
    async setActive(kind: 'companies' | 'people', id: string, active: boolean) { await client.collection(`contacts_${kind}`).update(id, { active }) },
    async addresses(company: string) { return z.array(addressSchema).parse(await client.collection('contacts_addresses').getFullList({ filter: client.filter('company = {:company}', { company }), sort: 'type,created', requestKey: null })) },
    async saveAddress(input: AddressInput, id?: string) { return addressSchema.parse(id ? await client.collection('contacts_addresses').update(id, input) : await client.collection('contacts_addresses').create(input)) },
    async saveRole(company: string, role: string, active: boolean, id?: string) { return roleSchema.parse(id ? await client.collection('contacts_company_roles').update(id, { active }) : await client.collection('contacts_company_roles').create({ company, role, active })) },
    async removeGallery(id: string, filename: string) { await client.collection('contacts_companies').update(id, { 'images-': [filename] }) },
    async imageURL(collectionId: string, id: string, filename: string) { const token = await client.files.getToken({ requestKey: null }); return client.files.getURL({ collectionId, id }, filename, { token }) },
  }
}
export type ContactsRepository = ReturnType<typeof createContactsRepository>
