import type { CSSProperties } from 'react'
import type { TextStyle } from '../schemas/templates'
export function backgroundColor(color: string, opacity = 1): string { return opacity === 1 ? color : `rgba(${[1, 3, 5].map((start) => parseInt(color.slice(start, start + 2), 16)).join(',')},${opacity})` }
export function textStyle(style: TextStyle): CSSProperties {
  const border = (side: 'top' | 'bottom' | 'left' | 'right') => style.borders ? style.borders[side] ? `${style.borders.width}px solid ${style.borders.color}` : 'none' : side === 'bottom' && style.border ? `1px solid ${style.color}` : undefined
  return { fontFamily: style.font, fontSize: style.size, color: style.color, backgroundColor: backgroundColor(style.background, style.backgroundOpacity), textAlign: style.align, fontWeight: style.bold ? 600 : 400, fontStyle: style.italic ? 'italic' : 'normal', textTransform: style.uppercase ? 'uppercase' : 'none', borderTop: border('top'), borderBottom: border('bottom'), borderLeft: border('left'), borderRight: border('right') }
}
