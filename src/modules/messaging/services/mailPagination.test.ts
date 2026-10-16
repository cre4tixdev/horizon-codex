import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'
const destination = runInNewContext(readFileSync('pocketbase/pb_hooks/lib/mail-pagination.js', 'utf8') + '; module.exports', { module: { exports: {} } }) as (origin: string, url: unknown, account: string, address: string) => string | null
const diagnostic = runInNewContext(readFileSync('pocketbase/pb_hooks/lib/mail-pagination.js', 'utf8') + '; module.exports.inspect', { module: { exports: {} } }) as (origin: string, url: unknown, account: string, address: string) => { url: string | null; reason: string }
const origin = 'https://graph.microsoft.com/v1.0', account = '11111111-2222-3333-4444-555555555555', address = 'sender@example.invalid'
const check = (url: unknown) => destination(origin, url, account, address)
describe('MailProvider pagination destination', () => {
  it('accepts canonical mailbox/folder IDs, OData forms and casing while preserving the complete opaque query', () => {
    const query = '?%24skiptoken=opaque%2f%2B%3D&%24filter=subject%20eq%20%27exemple%27'
    for (const principal of ['me', `users/${account}`, `users('${account}')`, 'users/sender%40example.invalid']) {
      for (const resource of ['messages', 'messages/', 'MailFolders/sentitems/Messages', 'mailFolders/AAMkAGUwNc4LTMzAAA%3D/messages', "mailFolders('AAMkAGUwNc4LTMzAAA%3D')/messages/"]) {
        const url = `${origin}/${principal}/${resource}${query}`
        expect(check(url)).toBe(url)
      }
    }
    for (const path of ['/me/messages/ID%2B%3D', '/me/messages/ID%2B%3D/attachments', '/me/messages/ID%2B%3D/attachments/FILE%3D']) expect(check(path)).toBe(origin + path)
  })
  it('rejects another origin, user, resource, traversal, fragment or malformed encoding before sending a bearer', () => {
    for (const url of [null, 12, '', origin + '/', 'http://graph.microsoft.com/v1.0/me/messages', 'https://graph.microsoft.com.evil.invalid/v1.0/me/messages', 'https://graph.microsoft.com@evil.invalid/v1.0/me/messages', origin + '/users/another-account/messages', origin + "/users('another-account')/messages", origin + '/users/someone%40example.invalid/messages', origin + '/me/drive', origin + '/me/messages/id/send', origin + '/me/messages/../drive', origin + '/me/messages/%2e%2e/drive', origin + '/me/messages/%252e%252e', origin + '/me/messages/%zz', origin + '/me/messages/%0d%0aHost:evil', origin + '/me/messages#fragment', origin + '/me/messages\r\nHost: evil.invalid', origin + '/me/messages/id\\..\\drive', origin + '//me/messages', origin + '/me/messages?' + 'a'.repeat(10000)]) expect(check(url)).toBeNull()
  })
  it('returns a stable rejection reason without reflecting the URL, account or opaque token', () => {
    const result = diagnostic(origin, origin + '/users/private-person/messages?private-token=NEVER-SHARE', account, address)
    expect(result).toEqual({ url: null, reason: 'mailbox' })
    expect(JSON.stringify(result)).not.toMatch(/private-person|NEVER-SHARE/)
    expect(diagnostic(origin, 'https://another.invalid/me/messages?token=PRIVATE', account, address)).toEqual({ url: null, reason: 'origin' })
    expect(diagnostic(origin, origin + '/me/drive?token=PRIVATE', account, address)).toEqual({ url: null, reason: 'resource' })
  })

})
