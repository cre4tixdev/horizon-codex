export function mentionParts(body: string, mentions: readonly { name: string }[] = []) {
  const labels = [...new Set(mentions.map((mention) => `@${mention.name}`))].sort((a, b) => b.length - a.length)
  if (!labels.length) return [{ text: body, mentioned: false }]
  const pattern = new RegExp(`(${labels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?=$|[^\\p{L}\\p{N}_-])`, 'u')
  return body.split(pattern).filter(Boolean).map((text) => ({ text, mentioned: labels.includes(text) }))
}
