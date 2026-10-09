import pagedRuntime from 'pagedjs-preview-runtime?raw'
import { paginateDocument } from './paginationRuntime'
/** Only our local runtime may execute; the document remains isolated from the Horizon origin. */
export function createPaginatedHtml(html: string, token: string) {
  const parsed = new DOMParser().parseFromString(html, 'text/html')
  for (const element of parsed.querySelectorAll('script,iframe,object,embed,link,base,meta,form')) element.remove()
  for (const element of parsed.querySelectorAll('*')) for (const attribute of [...element.attributes]) {
    if (/^on/i.test(attribute.name) || ['srcdoc', 'href', 'action'].includes(attribute.name)) element.removeAttribute(attribute.name)
    if (attribute.name === 'src' && !/^data:image\/(png|jpeg|webp);base64,/i.test(attribute.value)) element.removeAttribute('src')
  }
  const styles = [...parsed.querySelectorAll('style')].map((style) => style.textContent).join('\n')
  const source = parsed.querySelector('main')
  if (!source) throw new Error('Le document d’aperçu est incomplet.')
  parsed.head.replaceChildren()
  parsed.body.replaceChildren()
  const policy = parsed.createElement('meta')
  policy.httpEquiv = 'Content-Security-Policy'
  policy.content = `default-src 'none'; script-src 'nonce-${token}'; style-src 'unsafe-inline'; img-src data:; font-src data:; connect-src 'none'; base-uri 'none'; form-action 'none'`
  const css = parsed.createElement('style'); css.id = 'document-styles'; css.textContent = styles
  const template = parsed.createElement('template'); template.id = 'document-source'; template.content.append(source)
  const pages = parsed.createElement('div'); pages.id = 'document-pages'
  const script = parsed.createElement('script'); script.setAttribute('data-runtime-nonce', token)
  script.textContent = `${pagedRuntime}\n(${paginateDocument.toString()})(${JSON.stringify(token)});`.replace(/<\/script/gi, '<\\/script')
  parsed.head.append(policy, css)
  parsed.body.append(template, pages, script)
  // Browser nonce hiding would erase it if set before serializing the detached document.
  return '<!doctype html>' + parsed.documentElement.outerHTML.replace(`data-runtime-nonce="${token}"`, `nonce="${token}"`)
}
