import { describe, expect, it } from 'vitest'
import { parsePocketBaseUrl } from './parsePocketBaseUrl'

describe('Configuration publique PocketBase', () => {
  it('permet de démarrer le frontend sans backend configuré', () => {
    expect(parsePocketBaseUrl(undefined)).toBeUndefined()
  })
  it('considère une variable vide comme une configuration absente', () => {
    expect(parsePocketBaseUrl('')).toBeUndefined()
  })

  it.each([
    ['http://172.30.10.10:50190/', 'http://172.30.10.10:50190'],
    ['https://erp.example.test/pocketbase/', 'https://erp.example.test/pocketbase'],
  ])('conserve une adresse valide et son éventuel sous-chemin : %s', (input, expected) => {
    expect(parsePocketBaseUrl(input)).toBe(expected)
  })

  it.each([
    'adresse-invalide',
    'file:///etc/passwd',
    'javascript:alert(1)',
    'https://admin:secret@example.test',
    'https://example.test?token=secret',
    'https://example.test/#secret',
  ])('rejette une configuration invalide sans la divulguer', (input) => {
    expect(() => parsePocketBaseUrl(input)).toThrow('Configuration PocketBase invalide')
    try {
      parsePocketBaseUrl(input)
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      if (error instanceof Error) expect(error.message).not.toContain('secret')
    }
  })
})
