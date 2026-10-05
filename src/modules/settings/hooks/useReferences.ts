import { useQuery } from '@tanstack/react-query'
import { referencesService } from '../services/ReferencesService'
import type { CatalogName } from '../types/references'
export function useReferences(catalog: CatalogName) { return useQuery({ queryKey: ['references', catalog], queryFn: () => referencesService.list(catalog), staleTime: 60_000, retry: false }) }
