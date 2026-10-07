import { useQuery } from '@tanstack/react-query'
import { crmSettingsService } from '../services/CrmSettingsService'
export function useCrmSettings(enabled = true) {
  return useQuery({ queryKey: ['settings', 'crm'], queryFn: () => crmSettingsService.read(), enabled, retry: false })
}
