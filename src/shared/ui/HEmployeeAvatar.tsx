import { useQuery } from '@tanstack/react-query'
import { useFileSource } from '../hooks/useFileSource'
/** Photo access remains with the business owner supplied by the caller. */
export function HEmployeeAvatar({ name, queryKey, hasPhoto, load }: { name: string; queryKey: readonly unknown[]; hasPhoto: boolean; load: () => Promise<Blob | null> }) {
  const photo = useQuery({ queryKey, queryFn: load, enabled: hasPhoto, staleTime: 60_000, retry: false }), { image } = useFileSource(photo.data || undefined)
  return <span className="hr-initials" title={photo.error ? 'Photo indisponible' : undefined}>{photo.data ? <img ref={image} alt={`Photo de ${name}`} /> : name.split(' ').filter(Boolean).slice(0, 2).map((value) => value[0]).join('')}</span>
}
