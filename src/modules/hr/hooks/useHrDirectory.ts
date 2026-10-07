import { useQuery } from '@tanstack/react-query'
import { hrService } from '../services/HrService'
export function useHrDirectory(enabled: boolean) { return useQuery({ queryKey: ['hr', 'directory'], queryFn: hrService.directory, enabled }) }
