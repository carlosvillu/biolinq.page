import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'

import { colors } from '../../utils/colors'
import { LinkCard } from '../LinkCard'

const links = [
  { emoji: '🐦', title: 'Twitter' },
  { emoji: '📧', title: 'Contacto' },
  { emoji: '🌐', title: 'Mi Portfolio' },
  { emoji: '📸', title: 'Instagram' },
]

export const ProfilePreviewScene = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Phone frame animation
  const phoneScale = spring({
    frame,
    fps,
    config: { damping: 200 },
  })

  // Avatar animation
  const avatarScale = spring({
    frame: frame - 15,
    fps,
    config: { damping: 15 },
  })

  // Name animation
  const nameOpacity = interpolate(frame, [25, 40], [0, 1], {
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
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, system-ui, sans-serif',
        gap: 100,
      }}
    >
      {/* Left side - Text */}
      <div style={{ maxWidth: 500 }}>
        <h2
          style={{
            fontSize: 64,
            fontWeight: 900,
            color: colors.dark,
            letterSpacing: '-0.05em',
            lineHeight: 1,
            marginBottom: 24,
            opacity: interpolate(frame, [10, 30], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          Tu perfil,
          <br />
          tu estilo
        </h2>
        <p
          style={{
            fontSize: 24,
            color: colors.textMuted,
            lineHeight: 1.6,
            opacity: interpolate(frame, [30, 50], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          Configura una vez, olvídate para siempre.
          <br />
          Revisa stats ocasionalmente.
        </p>
      </div>

      {/* Right side - Phone mockup */}
      <div
        style={{
          transform: `scale(${phoneScale})`,
        }}
      >
        {/* Phone frame */}
        <div
          style={{
            width: 340,
            height: 680,
            backgroundColor: colors.dark,
            borderRadius: 40,
            padding: 12,
            boxShadow: `12px 12px 0 0 rgba(0,0,0,0.3)`,
          }}
        >
          {/* Phone screen */}
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: colors.canvas,
              borderRadius: 32,
              padding: 32,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 80,
                height: 80,
                backgroundColor: colors.primary,
                border: `3px solid ${colors.dark}`,
                borderRadius: '50%',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `scale(${Math.max(0, avatarScale)})`,
                boxShadow: `3px 3px 0 0 ${colors.dark}`,
              }}
            >
              <span style={{ fontSize: 40 }}>👤</span>
            </div>

            {/* Name */}
            <h3
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: colors.dark,
                marginBottom: 24,
                opacity: nameOpacity,
              }}
            >
              @usuario
            </h3>

            {/* Links */}
            <div
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {links.map((link, index) => {
                const delay = 40 + index * 8
                const linkScale = spring({
                  frame: frame - delay,
                  fps,
                  config: { damping: 15 },
                })

                return (
                  <div
                    key={link.title}
                    style={{
                      transform: `scale(${Math.max(0, linkScale)})`,
                    }}
                  >
                    <LinkCard emoji={link.emoji} title={link.title} shadowOffset={3} />
                  </div>
                )
              })}
            </div>

            {/* Watermark */}
            <div
              style={{
                marginTop: 'auto',
                fontSize: 12,
                color: colors.textMuted,
                opacity: interpolate(frame, [90, 100], [0, 0.6], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                }),
              }}
            >
              Made with BioLinq.page
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
