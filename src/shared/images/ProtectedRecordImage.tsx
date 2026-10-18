import { useQuery } from '@tanstack/react-query'
export function ProtectedRecordImage({ collectionId, id, filename, loadURL, className }: { collectionId: string; id: string; filename: string; loadURL: (collectionId: string, id: string, filename: string) => Promise<string>; className?: string | undefined }) {
  const image = useQuery({ queryKey: ['protected-image', collectionId, id, filename], queryFn: () => loadURL(collectionId, id, filename), staleTime: 60_000, refetchInterval: 60_000, retry: false })
  return image.data ? <img src={image.data} alt="" className={className} referrerPolicy="no-referrer" /> : <span title={image.error ? 'Image indisponible' : 'Chargement de l’image'} className={className} aria-label={image.error ? 'Image indisponible' : undefined} />
}
