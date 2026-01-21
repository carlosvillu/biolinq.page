import type { CSSProperties, ReactNode } from 'react'

import { colors } from '../utils/colors'

type NeoBrutalCardProps = {
  children: ReactNode
  backgroundColor?: string
  shadowOffset?: number
  style?: CSSProperties
}

export const NeoBrutalCard = ({
  children,
  backgroundColor = colors.white,
  shadowOffset = 6,
  style,
}: NeoBrutalCardProps) => {
  return (
    <div
      style={{
        position: 'relative',
        ...style,
      }}
    >
      {/* Shadow Layer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: colors.dark,
          borderRadius: 12,
          transform: `translate(${shadowOffset}px, ${shadowOffset}px)`,
        }}
      />
      {/* Card Face */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          backgroundColor,
          border: `3px solid ${colors.dark}`,
          borderRadius: 12,
          padding: 32,
        }}
      >
        {children}
      </div>
    </div>
  )
}
