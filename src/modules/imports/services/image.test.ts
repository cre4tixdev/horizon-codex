import { expect, it } from 'vitest'
import { importImageSource } from './image'
it('affiche uniquement les images base64 raster bornées', () => {
  const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aFOsAAAAASUVORK5CYII='
  expect(importImageSource(png.slice(0, 20) + '\n' + png.slice(20))).toBe(`data:image/png;base64,${png}`)
  expect(importImageSource(png)).toBe(`data:image/png;base64,${png}`)
  expect(importImageSource(`data:image/png;base64,${png}`)).toBe(`data:image/png;base64,${png}`)
  expect(importImageSource('data:image/svg+xml;base64,PHN2Zz4=')).toBe('')
  expect(importImageSource('https://example.invalid/image.png')).toBe('')
  expect(importImageSource('iVBORw0KGgo' + 'A'.repeat(200000))).toBe('')
})
