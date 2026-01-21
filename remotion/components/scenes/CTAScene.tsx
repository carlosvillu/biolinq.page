import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'

import { colors } from '../../utils/colors'
import { NeoBrutalButton } from '../NeoBrutalButton'

export const CTAScene = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Price animation
  const priceScale = spring({
    frame,
    fps,
    config: { damping: 12 },
  })

  // Title animation
  const titleOpacity = interpolate(frame, [15, 35], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const titleY = interpolate(frame, [15, 35], [40, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // Features animation
  const features = ['Links ilimitados', 'Analytics completas', 'Sin watermark', 'Dominios custom']

  // Button animation
  const buttonScale = spring({
    frame: frame - 60,
    fps,
    config: { damping: 15 },
  })

  // URL animation
  const urlOpacity = interpolate(frame, [80, 95], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: colors.primary,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, system-ui, sans-serif',
        padding: 80,
      }}
    >
      {/* Price */}
      <div
        style={{
          transform: `scale(${Math.max(0, priceScale)})`,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            backgroundColor: colors.dark,
            color: colors.white,
            fontSize: 32,
            fontWeight: 900,
            padding: '16px 40px',
            borderRadius: 8,
            boxShadow: `6px 6px 0 0 rgba(0,0,0,0.3)`,
          }}
        >
          Solo 5€ · Para siempre
        </div>
      </div>

      {/* Title */}
      <h2
        style={{
          fontSize: 80,
          fontWeight: 900,
          color: colors.dark,
          letterSpacing: '-0.05em',
          lineHeight: 0.9,
          textAlign: 'center',
          marginBottom: 40,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        Menos es más.
      </h2>

      {/* Features */}
      <div
        style={{
          display: 'flex',
          gap: 24,
          marginBottom: 48,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {features.map((feature, index) => {
          const delay = 35 + index * 6
          const featureOpacity = interpolate(frame, [delay, delay + 10], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })
          const featureY = interpolate(frame, [delay, delay + 10], [15, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })

          return (
            <div
              key={feature}
              style={{
                backgroundColor: colors.white,
                border: `3px solid ${colors.dark}`,
                padding: '12px 24px',
                borderRadius: 4,
                fontSize: 18,
                fontWeight: 600,
                color: colors.dark,
                boxShadow: `3px 3px 0 0 ${colors.dark}`,
                opacity: featureOpacity,
                transform: `translateY(${featureY}px)`,
              }}
            >
              ✓ {feature}
            </div>
          )
        })}
      </div>

      {/* CTA Button */}
      <div
        style={{
          transform: `scale(${Math.max(0, buttonScale)})`,
          marginBottom: 32,
        }}
      >
        <NeoBrutalButton backgroundColor={colors.dark}>
          <span style={{ color: colors.white }}>Crear mi BioLinq</span>
        </NeoBrutalButton>
      </div>

      {/* URL */}
      <div
        style={{
          opacity: urlOpacity,
          fontSize: 28,
          fontWeight: 700,
          color: colors.dark,
          fontFamily: 'monospace',
        }}
      >
        biolinq.page
      </div>
    </div>
  )
}
