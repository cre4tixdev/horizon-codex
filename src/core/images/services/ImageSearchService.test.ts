import { afterEach, describe, expect, it, vi } from 'vitest'
import { imageSearchService } from './ImageSearchService'

afterEach(() => vi.unstubAllGlobals())
describe('shared image search', () => {
  it('opens an encoded Google Images query with the chosen format', () => {
    const url = new URL(imageSearchService.googleURL(' Sony caméra & objectif ', 'jpeg'))
    expect(url.origin).toBe('https://www.google.com')
    expect(url.searchParams.get('tbm')).toBe('isch')
    expect(url.searchParams.get('q')).toBe('Sony caméra & objectif filetype:jpg')
    expect(new URL(imageSearchService.googleURL('Produit', 'all')).searchParams.get('q')).toBe('Produit')
    expect(() => imageSearchService.googleURL(' ', 'all')).toThrow('2 et 160')
  })
  it('rejects unsupported and oversize clipboard images before decoding', async () => {
    const decode = vi.fn()
    vi.stubGlobal('createImageBitmap', decode)
    await expect(imageSearchService.prepareClipboardImage(new File(['svg'], 'image.svg', { type: 'image/svg+xml' }))).rejects.toThrow('PNG, JPEG ou WebP')
    await expect(imageSearchService.prepareClipboardImage(new File([new Uint8Array(2097153)], 'image.png', { type: 'image/png' }))).rejects.toThrow('2 Mio')
    expect(decode).not.toHaveBeenCalled()
  })
  it('checks image decoding and preserves pasted bytes without a network request', async () => {
    const close = vi.fn()
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValueOnce({ close }).mockRejectedValueOnce(new Error('Invalid image')))
    const file = new File(['image bytes'], 'clipboard.jpeg', { type: 'image/jpeg' })
    const prepared = await imageSearchService.prepareClipboardImage(file)
    expect(prepared.name).toBe('image-collee.jpg')
    expect(prepared.type).toBe('image/jpeg')
    expect(await prepared.text()).toBe(await file.text())
    expect(close).toHaveBeenCalledOnce()
    await expect(imageSearchService.prepareClipboardImage(file)).rejects.toThrow('invalide')
  })
})
