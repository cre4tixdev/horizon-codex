import { expect, it } from 'vitest'
import { ClientResponseError } from 'pocketbase'
import { importErrorMessage } from './errors'

it('traduit les refus natifs sans exposer les valeurs ni le message générique anglais', () => {
  const error = new ClientResponseError({ status: 400, response: { message: 'Something went wrong while processing your request.', data: { email: { code: 'validation_is_email', message: 'Must be a valid email address.' }, internal_secret: 'hidden' } } })
  expect(importErrorMessage(error)).toContain('E-mail')
  expect(importErrorMessage(error)).not.toMatch(/hidden|internal_secret|Something went wrong/)
  expect(importErrorMessage(new ClientResponseError({ status: 400, response: { message: 'Ligne 12 : E-mail invalide.' } }))).toBe('Ligne 12 : E-mail invalide.')
  expect(importErrorMessage(new ClientResponseError({ status: 400, response: { message: 'Something went wrong while processing your request.' } }))).toContain('refusé')
  expect(importErrorMessage(new Error('private data'))).not.toContain('private data')
})
