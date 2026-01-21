import type { CSSProperties } from 'react'

import { colors } from '../utils/colors'

type NeoBrutalBadgeProps = {
  children: string
  backgroundColor?: string
  rotate?: number
  style?: CSSProperties
}

export const NeoBrutalBadge = ({
  children,
  backgroundColor = colors.accent,
  rotate = -6,
  style,
}: NeoBrutalBadgeProps) => {
  return (
    <span
      style={{
        display: 'inline-block',
        backgroundColor,
        border: `2px solid ${colors.dark}`,
        color: colors.white,
        fontSize: 12,
        fontWeight: 700,
        padding: '4px 8px',
        transform: `rotate(${rotate}deg)`,
        boxShadow: `2px 2px 0 0 ${colors.dark}`,
        ...style,
      }}
    >
      {children}
    </span>
  )
}
