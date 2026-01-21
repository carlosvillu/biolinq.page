import type { CSSProperties, ReactNode } from 'react'

import { colors } from '../utils/colors'

type NeoBrutalButtonProps = {
  children: ReactNode
  backgroundColor?: string
  shadowOffset?: number
  style?: CSSProperties
}

export const NeoBrutalButton = ({
  children,
  backgroundColor = colors.primary,
  shadowOffset = 4,
  style,
}: NeoBrutalButtonProps) => {
  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-block',
        ...style,
      }}
    >
      {/* Shadow Layer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: colors.dark,
          borderRadius: 4,
          transform: `translate(${shadowOffset}px, ${shadowOffset}px)`,
        }}
      />
      {/* Button Face */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          backgroundColor,
          border: `3px solid ${colors.dark}`,
          borderRadius: 4,
          padding: '16px 32px',
          fontWeight: 700,
          fontSize: 20,
          color: colors.dark,
        }}
      >
        {children}
      </div>
    </div>
  )
}
