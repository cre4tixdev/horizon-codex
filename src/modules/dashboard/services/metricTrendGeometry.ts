/** Background sparkline. Each currency keeps its own scale; negative margins stay below zero. */
export function metricTrendGeometry(values: number[]) {
  if (!values.length) return null
  const min = Math.min(0, ...values), max = Math.max(0, ...values), scale = max - min || 1
  const x = (index: number) => values.length === 1 ? 160 : index * 320 / (values.length - 1)
  const y = (value: number) => 92 - (value - min) / scale * 76
  const points = values.map((value, index) => ({ x: x(index), y: y(value) }))
  const path = points.map((point, index) => {
    const previous = points[index - 1]
    if (!previous) return `M${point.x},${point.y}`
    const mid = (previous.x + point.x) / 2
    return `C${mid},${previous.y} ${mid},${point.y} ${point.x},${point.y}`
  }).join(' ')
  return { path, area: `${path} L${points.at(-1)!.x},${y(0)} L${points[0]!.x},${y(0)} Z`, baseline: y(0) }
}
