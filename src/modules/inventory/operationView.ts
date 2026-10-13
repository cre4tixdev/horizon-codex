export function operationView(params: URLSearchParams): 'dashboard' | 'list' {
  const explicit = params.get('view')
  if (explicit === 'dashboard' || explicit === 'list') return explicit
  return [...params.keys()].some((key) => key !== 'view') ? 'list' : 'dashboard'
}
export function changeOperationView(params: URLSearchParams, view: string): URLSearchParams {
  const next = new URLSearchParams(params)
  next.set('view', view === 'list' ? 'list' : 'dashboard'); next.delete('page')
  return next
}
