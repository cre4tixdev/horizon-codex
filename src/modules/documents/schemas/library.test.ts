import { describe, expect, it } from 'vitest'
import { folderPath, previewable, type LibraryFolder } from './library'
const folder = (id: string, name: string, parent = ''): LibraryFolder => ({ id, name, parent, space: 'affairs', visibility: 'team', readers: [], active: true, created_by: 'author', updated: '2026-10-16' })
describe('Présentation des fichiers GED', () => {
  it('reserves the inline preview for PDF and supported images', () => {
    expect(previewable('Plan.PDF')).toBe(true)
    expect(previewable('Implantation.webp')).toBe(true)
    expect(previewable('Mémoire.docx')).toBe(false)
    expect(previewable('Instructions.txt')).toBe(false)
    expect(previewable('page.html')).toBe(false)
  })
  it('distinguishes identically named subfolders by their full authorized path', () => {
    const folders = [folder('a', '11450 · Affaire A'), folder('b', '11451 · Affaire B'), folder('aa', 'Plans', 'a'), folder('bb', 'Plans', 'b')]
    expect(folderPath(folders, 'aa')).toBe('11450 · Affaire A / Plans')
    expect(folderPath(folders, 'bb')).toBe('11451 · Affaire B / Plans')
    expect(folderPath(folders, '')).toBe('')
  })
})
