import { ClientResponseError } from 'pocketbase'
import { z } from 'zod'
import { createPocketBaseClient } from '../../../core/pocketbase/client'
import { addressSchema, companySchema, personSchema, roleSchema } from '../schemas/contacts'
import type { AddressChange, AddressInput, CompanyInput, ContactFiles, ListOptions, PersonInput, Company, Person, Paged } from '../types/contacts'

export class ContactsUpgradeError extends Error { constructor() { super('Mise à jour PocketBase requise : installez la migration Contacts et les nouveaux hooks avant de modifier les fiches.') } }
export function createContactsRepository(url: string) {
  const client = createPocketBaseClient(url)
  const pageSchema = <T>(schema: z.ZodType<T>) => z.object({ items: z.array(schema), totalPages: z.number(), totalItems: z.number() })
  const sort = (options: ListOptions, allowed: string[], fallback: string) => `${options.descending ? '-' : ''}${options.sort && allowed.includes(options.sort) ? options.sort : fallback},id`
  const filter = (options: ListOptions, fields: string[]) => [client.filter('active = {:active}', { active: !options.archived }), ...options.search.trim().split(/\s+/).filter(Boolean).map((term) => client.filter(`(${fields.map((field) => `${field} ~ {:search}`).join(' || ')})`, { search: term }))].join(' && ')
  const roleFilter = (options: ListOptions, relation: string) => options.role === 'customer' || options.role === 'supplier'
    ? ' && ' + client.filter(`${relation}.role ?= {:role} && ${relation}.active ?= true`, { role: options.role })
    : ''
  async function grouped(kind: 'companies' | 'people', options: ListOptions) {
    const metadata = z.object({ items: z.array(z.object({ id: z.string(), group_key: z.string(), group_label: z.string() })), groups: z.array(z.object({ group_key: z.string(), group_label: z.string(), total: z.number() })), totalItems: z.number(), totalPages: z.number() }).parse(await client.send('/api/horizon/contacts/groups', { method: 'GET', requestKey: null, query: { kind, group: options.group, q: options.search, role: options.role ?? 'all', state: options.archived ? 'archived' : 'active', page: options.page, sort: options.sort ?? (kind === 'companies' ? 'name' : 'last_name'), direction: options.descending ? 'desc' : 'asc' } }))
    const expand = kind === 'companies' ? 'contacts_company_roles_via_company,contacts_addresses_via_company' : 'company,company.contacts_company_roles_via_company,company.contacts_addresses_via_company'
    const records = metadata.items.length ? (await client.collection(`contacts_${kind}`).getList(1, 25, { filter: metadata.items.map((item) => client.filter('id = {:id}', { id: item.id })).join(' || '), expand, requestKey: null })).items : []
    const items = metadata.items.flatMap((item) => records.filter((record) => record.id === item.id))
    const groups = metadata.groups.map((group) => ({ key: group.group_key, label: group.group_label || (options.group === 'company' ? 'Sans société' : 'Pays non renseigné'), total: group.total, ids: metadata.items.filter((item) => item.group_key === group.group_key).map((item) => item.id) }))
    return { items, totalItems: metadata.totalItems, totalPages: metadata.totalPages, groups }
  }
  function data(input: CompanyInput | PersonInput, files: ContactFiles, imageField: 'logo' | 'avatar') {
    const result = new FormData()
    for (const [key, value] of Object.entries(input)) result.set(key, value)
    if (files.image) result.set(imageField, files.image)
    else if (files.removeImage) result.set(imageField, '')
    for (const file of files.gallery ?? []) result.append('images+', file)
    return result
  }
  async function ensureRevision() {
    try {
      const status = z.object({ contacts_revision: z.number() }).parse(await client.send('/api/horizon/company-lookup/status', { method: 'GET', requestKey: null }))
      if (status.contacts_revision !== 5) throw new ContactsUpgradeError()
      return true
    } catch (error) { if (error instanceof ClientResponseError && error.status === 404) throw new ContactsUpgradeError(); throw error }
  }
  const options = (operation?: string) => ({ headers: operation ? { 'X-Horizon-Operation': operation } : {} })
  return {
    async companyPeopleCount(company: string) {
      return z.number().int().nonnegative().parse((await client.collection('contacts_people').getList(1, 1, { filter: client.filter('company = {:company} && active = true', { company }), fields: 'id', requestKey: null })).totalItems)
    },
    async navigation(kind: 'companies' | 'people', id: string, options: ListOptions) {
      return z.object({ position: z.number().int().nonnegative(), total: z.number().int().nonnegative(), previous: z.string(), next: z.string() }).parse(await client.send('/api/horizon/contacts/navigation', { method: 'GET', requestKey: null, query: { kind, id, group: options.group ?? 'none', q: options.search, role: options.role ?? 'all', state: options.archived ? 'archived' : 'active', sort: options.sort ?? (kind === 'companies' ? 'name' : 'last_name'), direction: options.descending ? 'desc' : 'asc' } }))
    },
    ensureRevision,
    async summary() {
      const count = async (collection: string, filter: string) => z.number().int().nonnegative().parse((await client.collection(collection).getList(1, 1, { filter, fields: 'id', requestKey: null })).totalItems)
      const [people, companies, customers, suppliers] = await Promise.all([
        count('contacts_people', 'active = true'), count('contacts_companies', 'active = true'),
        count('contacts_company_roles', 'active = true && company.active = true && role = "customer"'),
        count('contacts_company_roles', 'active = true && company.active = true && role = "supplier"'),
      ])
      return { people, companies, customers, suppliers }
    },
    async companies(options: ListOptions): Promise<Paged<Company>> { if (options.group) { const result = await grouped('companies', options); return { ...pageSchema(companySchema).parse(result), groups: result.groups } } return pageSchema(companySchema).parse(await client.collection('contacts_companies').getList(options.page, 25, { filter: filter(options, ['name', 'legal_name', 'email']) + roleFilter(options, 'contacts_company_roles_via_company'), sort: sort(options, ['name', 'email', 'legal_name'], 'name'), expand: 'contacts_company_roles_via_company,contacts_addresses_via_company', requestKey: null })) },
    async people(options: ListOptions): Promise<Paged<Person>> { if (options.group) { const result = await grouped('people', options); return { ...pageSchema(personSchema).parse(result), groups: result.groups } } return pageSchema(personSchema).parse(await client.collection('contacts_people').getList(options.page, 25, { filter: `${filter(options, ['first_name', 'last_name', 'email', 'company.name'])}${options.company ? ' && ' + client.filter('company = {:company}', { company: options.company }) : ''}${roleFilter(options, 'company.contacts_company_roles_via_company')}`, sort: sort(options, ['last_name', 'email'], 'last_name'), expand: 'company,company.contacts_company_roles_via_company,company.contacts_addresses_via_company', requestKey: null })) },
    async company(id: string) { return companySchema.parse(await client.collection('contacts_companies').getOne(id, { expand: 'contacts_company_roles_via_company,contacts_addresses_via_company', requestKey: null })) },
    async person(id: string) { return personSchema.parse(await client.collection('contacts_people').getOne(id, { expand: 'company,company.contacts_company_roles_via_company,company.contacts_addresses_via_company', requestKey: null })) },
    async saveCompany(input: CompanyInput, files: ContactFiles, id?: string, operation?: string) {
      await ensureRevision()
      const body = data(input, files, 'logo')
      if (!id) body.set('active', 'true')
      return companySchema.parse(id ? await client.collection('contacts_companies').update(id, body, options(operation)) : await client.collection('contacts_companies').create(body, options(operation)))
    },
    async savePerson(input: PersonInput, files: ContactFiles, id?: string) {
      const body = data(input, files, 'avatar')
      if (!id) body.set('active', 'true')
      return personSchema.parse(id ? await client.collection('contacts_people').update(id, body) : await client.collection('contacts_people').create(body))
    },
    async deleteRecord(kind: 'companies' | 'people', id: string) { await client.collection(`contacts_${kind}`).delete(id) },
    async setActive(kind: 'companies' | 'people', id: string, active: boolean) { await client.collection(`contacts_${kind}`).update(id, { active }) },
    async addresses(company: string) { return z.array(addressSchema).parse(await client.collection('contacts_addresses').getFullList({ filter: client.filter('company = {:company}', { company }), sort: 'type,created', requestKey: null })) },
    async saveAddress(input: AddressInput, id?: string, operation?: string) { await ensureRevision(); return addressSchema.parse(id ? await client.collection('contacts_addresses').update(id, input, options(operation)) : await client.collection('contacts_addresses').create(input, options(operation))) },
    async saveAddresses(company: string, entries: AddressChange[], operation: string) { await ensureRevision(); return z.object({ items: z.array(addressSchema) }).parse(await client.send('/api/horizon/contacts/addresses/save', { method: 'POST', body: { company, entries, operation } })).items },
    async saveRole(company: string, role: string, active: boolean, id?: string, operation?: string) { return roleSchema.parse(id ? await client.collection('contacts_company_roles').update(id, { active }, options(operation)) : await client.collection('contacts_company_roles').create({ company, role, active }, options(operation))) },
    async removeGallery(id: string, filename: string) { await client.collection('contacts_companies').update(id, { 'images-': [filename] }) },
    async imageURL(collectionId: string, id: string, filename: string) { const token = await client.files.getToken({ requestKey: null }); return client.files.getURL({ collectionId, id }, filename, { token }) },
  }
}
export type ContactsRepository = ReturnType<typeof createContactsRepository>
