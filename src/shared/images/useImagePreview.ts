import { useEffect, useState } from 'react'

/** Aperçu local sans persister le fichier ni conserver une URL après fermeture. */
export function useImagePreview(file?: Blob | null) {
  const [preview, setPreview] = useState<{ file: Blob; url: string }>()
  useEffect(() => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => { if (typeof reader.result === 'string') setPreview({ file, url: reader.result }) }
    reader.readAsDataURL(file)
    return () => { reader.onload = null; if (reader.readyState === FileReader.LOADING) reader.abort() }
  }, [file])
  return file && preview?.file === file ? preview.url : ''
}
