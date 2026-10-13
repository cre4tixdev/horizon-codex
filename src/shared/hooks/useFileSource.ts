import { useEffect, useRef } from 'react'

/** Own local blob URLs and synchronize the native image/PDF viewer. */
export function useFileSource(input: File | string | undefined, pdfFragment = '') {
  const image = useRef<HTMLImageElement>(null), frame = useRef<HTMLIFrameElement>(null), source = useRef('')
  useEffect(() => {
    if (!input) return
    const url = typeof input === 'string' ? input : URL.createObjectURL(input)
    source.current = url
    if (image.current) image.current.src = url
    if (frame.current) frame.current.src = url + pdfFragment
    return () => { source.current = ''; if (typeof input !== 'string') URL.revokeObjectURL(url) }
  }, [input, pdfFragment])
  return { image, frame, source }
}
