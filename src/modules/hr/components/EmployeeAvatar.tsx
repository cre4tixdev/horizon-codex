import { useQuery } from '@tanstack/react-query'
import type { Employee } from '../schemas/employees'
import { hrService } from '../services/HrService'
export function EmployeeAvatar({ employee }: { employee: Employee }) {
  const image = useQuery({ queryKey: ['hr', 'avatar', employee.id, employee.avatar], queryFn: () => hrService.imageURL(employee), enabled: Boolean(employee.avatar), staleTime: 60000, retry: false })
  return <span className="hr-initials" title={image.error ? 'Photo indisponible' : undefined}>{image.data ? <img src={image.data} alt="" referrerPolicy="no-referrer" /> : `${employee.first_name[0] || ''}${employee.last_name[0] || ''}`}</span>
}
