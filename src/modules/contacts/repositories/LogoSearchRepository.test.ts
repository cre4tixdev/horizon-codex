import { afterEach, describe, expect, it, vi } from 'vitest'
import { logoSearchRepository } from './LogoSearchRepository'
const info = { url: 'https://upload.wikimedia.org/logo.svg', thumburl: 'https://thumb.wikimedia.org/logo.png', descriptionurl: 'https://commons.wikimedia.org/wiki/File:Logo.svg', mime: 'image/svg+xml', thumbmime: 'image/png', width: 400, height: 120 }
afterEach(() => vi.unstubAllGlobals())
describe('Wikimedia logo search', () => {
  it('orders results, uses PNG rendering for SVG, and filters unsupported files', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ query: { pages: [
      { pageid: 2, index: 2, title: 'File:Second.svg', imageinfo: [info] },
      { pageid: 1, index: 1, title: 'File:First.svg', imageinfo: [info] },
      { pageid: 3, index: 3, title: 'File:Document.pdf', imageinfo: [{ ...info, thumbmime: 'application/pdf' }] },
    ] } })))
    vi.stubGlobal('fetch', fetcher)
    const result = await logoSearchRepository.search('TF1 logo', 'png')
    expect(result.map((item) => item.id)).toEqual([1, 2])
    expect(result[0]?.imageUrl).toBe(info.thumburl)
    expect(result[0]?.mime).toBe('image/png')
    const url = new URL(fetcher.mock.calls[0]![0])
    expect(url.searchParams.get('gsrsearch')).toBe('TF1 logo filemime:image/png')
    expect(fetcher.mock.calls[0]![1].credentials).toBe('omit')
  })
  it('handles empty results and service errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response('{}')).mockResolvedValueOnce(new Response('', { status: 429 })))
    expect(await logoSearchRepository.search('Absent', 'all')).toEqual([])
    await expect(logoSearchRepository.search('Absent', 'all')).rejects.toThrow('Trop de recherches')
  })
  it('refuses an image address outside Wikimedia before download', async () => {
    const fetcher = vi.fn()
    vi.stubGlobal('fetch', fetcher)
    await expect(logoSearchRepository.download({ id: 1, title: 'Logo', imageUrl: 'https://example.org/private', sourceUrl: info.descriptionurl, mime: 'image/png', width: 100, height: 100 })).rejects.toThrow()
    expect(fetcher).not.toHaveBeenCalled()
  })
  it('refuses oversize and non-image downloads', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response('x', { headers: { 'content-length': '3000000' } })).mockResolvedValueOnce(new Response('html', { headers: { 'content-type': 'text/html' } })))
    const image = { id: 1, title: 'Logo', imageUrl: info.thumburl, sourceUrl: info.descriptionurl, mime: 'image/png', width: 100, height: 100 }
    await expect(logoSearchRepository.download(image)).rejects.toThrow('2 Mio')
    await expect(logoSearchRepository.download(image)).rejects.toThrow('PNG, JPEG ou WebP')
  })
})
