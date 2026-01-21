import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'

import { colors } from '../../utils/colors'
import { NeoBrutalBadge } from '../NeoBrutalBadge'

export const HeroScene = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Animations
  const logoScale = spring({
    frame,
    fps,
    config: { damping: 200 },
  })

  const titleOpacity = interpolate(frame, [15, 35], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const titleY = interpolate(frame, [15, 35], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const taglineOpacity = interpolate(frame, [35, 55], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const taglineY = interpolate(frame, [35, 55], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const badgeScale = spring({
    frame: frame - 50,
    fps,
    config: { damping: 12 },
  })

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: colors.canvas,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Logo */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            backgroundColor: colors.primary,
            border: `4px solid ${colors.dark}`,
            borderRadius: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `6px 6px 0 0 ${colors.dark}`,
          }}
        >
          <span style={{ fontSize: 64 }}>🔗</span>
        </div>
      </div>

      {/* Title */}
      <h1
        style={{
          fontSize: 96,
          fontWeight: 900,
          color: colors.dark,
          letterSpacing: '-0.05em',
          lineHeight: 0.9,
          margin: 0,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        BioLinq.page
      </h1>

      {/* Tagline */}
      <p
        style={{
          fontSize: 36,
          fontWeight: 500,
          color: colors.textMuted,
          marginTop: 24,
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
        }}
      >
        El Linktree minimalista
      </p>

      {/* Badge */}
      <div
        style={{
          marginTop: 32,
          transform: `scale(${Math.max(0, badgeScale)})`,
        }}
      >
        <NeoBrutalBadge backgroundColor={colors.accent}>5€ LIFETIME</NeoBrutalBadge>
      </div>
    </div>
  )
}
