import type { CSSProperties } from 'react'

import { colors } from '../utils/colors'

type LinkCardProps = {
  emoji: string
  title: string
  shadowOffset?: number
  style?: CSSProperties
}

export const LinkCard = ({
  emoji,
  title,
  shadowOffset = 4,
  style,
}: LinkCardProps) => {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
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
      {/* Card Face */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          backgroundColor: colors.white,
          border: `3px solid ${colors.dark}`,
          borderRadius: 4,
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
        }}
      >
        <span style={{ fontSize: 24 }}>{emoji}</span>
        <span
          style={{
            fontWeight: 700,
            fontSize: 18,
            color: colors.dark,
          }}
        >
          {title}
        </span>
      </div>
    </div>
  )
}
