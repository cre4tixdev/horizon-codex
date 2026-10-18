import type { SourceData } from '../schemas/imports'
export type ImportSheet = { name: string; data: string[][] }
export function parseCsv(text: string, separator?: string): string[][] {
  const value = text.replace(/^\uFEFF/, ''), firstLine = value.split(/\r?\n/).find((line) => line.trim()) || ''
  const counts = new Map([[';', 0], [',', 0], ['\t', 0]]); let inside = false
  for (let i = 0; i < firstLine.length; i++) { const char = firstLine[i]!; if (char === '"') { if (inside && firstLine[i + 1] === '"') i++; else inside = !inside } else if (!inside && counts.has(char)) counts.set(char, counts.get(char)! + 1) }
  const delimiter = separator || [...counts].sort((a, b) => b[1] - a[1])[0]![0]
  const rows: string[][] = []; let row: string[] = [], cell = '', quoted = false
  for (let i = 0; i < value.length; i++) {
    const c = value[i]!
    if (c === '"') { if (quoted && value[i + 1] === '"') { cell += '"'; i++ } else if (quoted || !cell) quoted = !quoted; else throw new Error('Guillemet CSV inattendu. Vérifiez le fichier.') }
    else if (!quoted && c === delimiter) { row.push(cell); cell = '' }
    else if (!quoted && (c === '\r' || c === '\n')) { if (c === '\r' && value[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = '' }
    else cell += c
    if (cell.length > 200000 || row.length > 60 || rows.length > 1050) throw new Error('Fichier trop volumineux : 1 000 lignes et 60 colonnes maximum.')
  }
  if (quoted) throw new Error('Guillemet CSV non fermé.')
  row.push(cell); if (row.some((v) => v.trim())) rows.push(row)
  return rows
}
export async function readImportFile(file: File, encoding = 'utf-8', separator?: string): Promise<ImportSheet[]> {
  if (file.size > 10485760) throw new Error('Choisissez un fichier de 10 Mio maximum.')
  if (/\.csv$/i.test(file.name)) {
    const text = new TextDecoder(encoding, { fatal: true }).decode(await file.arrayBuffer())
    return [{ name: 'CSV', data: parseCsv(text, separator) }]
  }
  if (!/\.xlsx$/i.test(file.name)) throw new Error('Formats acceptés : .csv et .xlsx. Convertissez les anciens .xls avant import.')
  return new Promise<ImportSheet[]>((resolve, reject) => {
    const worker = new Worker(new URL('./excel.worker.ts', import.meta.url), { type: 'module' })
    const stop = () => { clearTimeout(timer); worker.terminate() }
    const timer = setTimeout(() => { stop(); reject(new Error('Lecture Excel trop longue. Réduisez le classeur ou exportez la feuille en CSV.')) }, 20_000)
    worker.onmessage = (event: MessageEvent<{ sheets?: ImportSheet[]; error?: string }>) => {
      stop()
      if (event.data.sheets) resolve(event.data.sheets)
      else reject(new Error(event.data.error || 'Classeur illisible.'))
    }
    worker.onerror = () => { stop(); reject(new Error('Le classeur Excel n’a pas pu être lu. Essayez un export CSV.')) }
    worker.postMessage(file)
  })
}
export function sheetSource(sheet: ImportSheet, headerLine: number, filename: string): SourceData {
  if (!Number.isInteger(headerLine) || headerLine < 1 || headerLine > 50 || !sheet.data[headerLine - 1]) throw new Error('Choisissez une ligne d’en-tête existante (1 à 50).')
  const width = sheet.data.reduce((max, row) => Math.max(max, row.length), 0)
  if (!width || width > 60) throw new Error('Le fichier doit comporter entre 1 et 60 colonnes.')
  const headers = Array.from({ length: width }, (_, i) => sheet.data[headerLine - 1]?.[i]?.trim() || `Colonne ${i + 1}`)
  const rows = sheet.data.slice(headerLine).filter((row) => row.some((value) => value.trim())).map((row) => headers.map((_, i) => row[i] || ''))
  if (!rows.length || rows.length > 1000) throw new Error('Choisissez entre 1 et 1 000 lignes de données.')
  return { headers, rows, namespace: filename, filename }
}
