import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'

import { colors } from '../../utils/colors'
import { NeoBrutalCard } from '../NeoBrutalCard'

const features = [
  { emoji: '⚡', title: 'Ultra Rápido', description: 'Carga en <500ms' },
  { emoji: '🎨', title: '4 Temas', description: 'Diseño profesional' },
  { emoji: '📊', title: 'Analytics', description: 'Visitas y clicks' },
  { emoji: '✨', title: 'Sin Watermark', description: 'Premium incluido' },
]

export const FeaturesScene = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Title animation
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const titleY = interpolate(frame, [0, 20], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: colors.panel,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, system-ui, sans-serif',
        padding: 80,
      }}
    >
      {/* Title */}
      <h2
        style={{
          fontSize: 64,
          fontWeight: 700,
          color: colors.dark,
          letterSpacing: '-0.03em',
          marginBottom: 60,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        Todo lo que necesitas
      </h2>

      {/* Features Grid */}
      <div
        style={{
          display: 'flex',
          gap: 32,
          flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: 1200,
        }}
      >
        {features.map((feature, index) => {
          const delay = 20 + index * 10
          const cardScale = spring({
            frame: frame - delay,
            fps,
            config: { damping: 15, stiffness: 150 },
          })

          return (
            <div
              key={feature.title}
              style={{
                transform: `scale(${Math.max(0, cardScale)})`,
                width: 260,
              }}
            >
              <NeoBrutalCard backgroundColor={colors.white} shadowOffset={5}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>{feature.emoji}</div>
                  <h3
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: colors.dark,
                      margin: 0,
                      marginBottom: 8,
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 16,
                      color: colors.textMuted,
                      margin: 0,
                    }}
                  >
                    {feature.description}
                  </p>
                </div>
              </NeoBrutalCard>
            </div>
          )
        })}
      </div>
    </div>
  )
}
