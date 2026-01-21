import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'

import { colors } from '../../utils/colors'
import { NeoBrutalBadge } from '../NeoBrutalBadge'
import { NeoBrutalCard } from '../NeoBrutalCard'

export const CustomDomainsScene = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Badge animation
  const badgeScale = spring({
    frame,
    fps,
    config: { damping: 12 },
  })

  // Title animation
  const titleOpacity = interpolate(frame, [10, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const titleY = interpolate(frame, [10, 30], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // Card animation
  const cardScale = spring({
    frame: frame - 25,
    fps,
    config: { damping: 200 },
  })

  // Domain text animation (typewriter effect)
  const fullDomain = 'links.tudominio.com'
  const charsToShow = Math.min(
    fullDomain.length,
    Math.floor(interpolate(frame, [40, 80], [0, fullDomain.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }))
  )
  const displayedDomain = fullDomain.slice(0, charsToShow)

  // Check marks animation
  const check1Opacity = interpolate(frame, [85, 95], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const check2Opacity = interpolate(frame, [95, 105], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
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
        padding: 80,
      }}
    >
      {/* NEW Badge */}
      <div
        style={{
          marginBottom: 24,
          transform: `scale(${Math.max(0, badgeScale)})`,
        }}
      >
        <NeoBrutalBadge rotate={-8}>NEW FEATURE</NeoBrutalBadge>
      </div>

      {/* Title */}
      <h2
        style={{
          fontSize: 72,
          fontWeight: 900,
          color: colors.dark,
          letterSpacing: '-0.05em',
          lineHeight: 0.9,
          marginBottom: 16,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        Dominios Personalizados
      </h2>

      {/* Subtitle */}
      <p
        style={{
          fontSize: 28,
          color: colors.textMuted,
          marginBottom: 48,
          opacity: titleOpacity,
        }}
      >
        Usa tu propio dominio para tu BioLinq
      </p>

      {/* Domain Card */}
      <div
        style={{
          transform: `scale(${Math.max(0, cardScale)})`,
          width: 600,
        }}
      >
        <NeoBrutalCard backgroundColor={colors.white} shadowOffset={8}>
          {/* Browser URL Bar */}
          <div
            style={{
              backgroundColor: colors.input,
              border: `2px solid ${colors.dark}`,
              borderRadius: 4,
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 24,
            }}
          >
            <span style={{ fontSize: 20 }}>🔒</span>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: 22,
                fontWeight: 600,
                color: colors.dark,
              }}
            >
              {displayedDomain}
              <span
                style={{
                  opacity: frame % 30 < 15 ? 1 : 0,
                  color: colors.primary,
                }}
              >
                |
              </span>
            </span>
          </div>

          {/* Features List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: check1Opacity }}>
              <span
                style={{
                  width: 28,
                  height: 28,
                  backgroundColor: colors.primary,
                  border: `2px solid ${colors.dark}`,
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                }}
              >
                ✓
              </span>
              <span style={{ fontSize: 20, fontWeight: 500, color: colors.dark }}>
                SSL automático incluido
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: check2Opacity }}>
              <span
                style={{
                  width: 28,
                  height: 28,
                  backgroundColor: colors.primary,
                  border: `2px solid ${colors.dark}`,
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                }}
              >
                ✓
              </span>
              <span style={{ fontSize: 20, fontWeight: 500, color: colors.dark }}>
                Verificación DNS en 2 pasos
              </span>
            </div>
          </div>
        </NeoBrutalCard>
      </div>
    </div>
  )
}
