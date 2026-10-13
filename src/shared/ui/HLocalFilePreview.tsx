import { HFileThumbnail } from './HFileThumbnail'
export function HLocalFilePreview({ file }: { file: File }) {
  return <HFileThumbnail key={`${file.name}-${file.lastModified}`} source={file} name={file.name} pdf={file.type === 'application/pdf'} />
}
