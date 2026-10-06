import type { z } from 'zod'
import type { addressInputSchema, addressSchema, companyInputSchema, companySchema, personInputSchema, personSchema, roleSchema } from '../schemas/contacts'
export type Company = z.infer<typeof companySchema>
export type Person = z.infer<typeof personSchema>
export type Address = z.infer<typeof addressSchema>
export type CompanyRole = z.infer<typeof roleSchema>
export type CompanyInput = z.infer<typeof companyInputSchema>
export type PersonInput = z.infer<typeof personInputSchema>
export type AddressInput = z.input<typeof addressInputSchema>
export type ContactKind = 'companies' | 'people'
export type ListOptions = { search: string; archived: boolean; page: number; sort?: string | undefined; company?: string | undefined; descending?: boolean | undefined }
export type ContactFiles = { image?: File | undefined; removeImage?: boolean; gallery?: File[] }
export type Paged<T> = { items: T[]; totalPages: number; totalItems: number }

export type AddressChange = { id?: string; creation_id?: string; input: AddressInput }
