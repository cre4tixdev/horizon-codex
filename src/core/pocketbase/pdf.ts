import type PocketBase from 'pocketbase'
export async function sendPdf(client: PocketBase, path: string, body: object) {
  let pdf: Blob | undefined, filename = ''
  await client.send(path, { method: 'POST', body, requestKey: null, fetch: async (request, init) => {
    const response = await fetch(request, init)
    if (!response.ok) return response
    const disposition = response.headers.get('Content-Disposition') || '', encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
    filename = encoded ? decodeURIComponent(encoded) : disposition.match(/filename="([^"]+)"/i)?.[1] || ''
    pdf = await response.blob()
    return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } })
  } })
  if (!pdf || pdf.type !== 'application/pdf') throw new Error('Réponse PDF invalide.')
  return { blob: pdf, filename }
}
