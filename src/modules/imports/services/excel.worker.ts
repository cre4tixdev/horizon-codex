import readExcelFile from 'read-excel-file/web-worker'
// Keep unzip/XML work away from the ERP interface. The caller can terminate it.
globalThis.onmessage = async (event: MessageEvent<File>) => {
  try {
    const sheets = await readExcelFile(event.data)
    if (sheets.some((sheet) => sheet.data.length > 1050 || sheet.data.some((row) => row.length > 60))) throw new Error('Classeur trop volumineux : 1 000 lignes et 60 colonnes maximum.')
    globalThis.postMessage({ sheets: sheets.map((sheet) => ({ name: sheet.sheet, data: sheet.data.map((row) => row.map((value) => value instanceof Date ? value.toISOString().slice(0, 10) : value === null ? '' : String(value))) })) })
  } catch (error) { globalThis.postMessage({ error: error instanceof Error ? error.message : 'Classeur illisible.' }) }
}
