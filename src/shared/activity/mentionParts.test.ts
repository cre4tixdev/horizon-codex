import { describe, expect, it } from 'vitest'
import { mentionParts } from './mentionParts'

describe('mentions dans un commentaire', () => {
  it('conserve le texte et met en évidence uniquement les personnes mentionnées', () => {
    expect(mentionParts('@Guillaume Clairardin test', [{ name: 'Guillaume Clairardin' }])).toEqual([
      { text: '@Guillaume Clairardin', mentioned: true }, { text: ' test', mentioned: false },
    ])
    expect(mentionParts('@Inconnu test')).toEqual([{ text: '@Inconnu test', mentioned: false }])
  })
  it('conserve les retours à la ligne, les noms similaires et les caractères spéciaux', () => {
    const body = '@Anne Marie,\n@Anne (CVS) ! @Anne-Marie'
    const parts = mentionParts(body, [{ name: 'Anne' }, { name: 'Anne Marie' }, { name: 'Anne (CVS)' }])
    expect(parts.map((part) => part.text).join('')).toBe(body)
    expect(parts.filter((part) => part.mentioned).map((part) => part.text)).toEqual(['@Anne Marie', '@Anne (CVS)'])
    expect(mentionParts('@AnneMarie', [{ name: 'Anne' }])).toEqual([{ text: '@AnneMarie', mentioned: false }])
  })
})
