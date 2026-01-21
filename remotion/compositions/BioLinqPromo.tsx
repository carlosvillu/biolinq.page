import { loadFont } from '@remotion/google-fonts/Inter'
import { linearTiming, TransitionSeries } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'

import { CTAScene } from '../components/scenes/CTAScene'
import { CustomDomainsScene } from '../components/scenes/CustomDomainsScene'
import { FeaturesScene } from '../components/scenes/FeaturesScene'
import { HeroScene } from '../components/scenes/HeroScene'
import { ProfilePreviewScene } from '../components/scenes/ProfilePreviewScene'

// Load Inter font
const { fontFamily } = loadFont('normal', {
  weights: ['400', '500', '700', '900'],
  subsets: ['latin'],
})

export type BioLinqPromoProps = {
  title: string
  tagline: string
}

export const BioLinqPromo = ({ title, tagline }: BioLinqPromoProps) => {
  const transitionDuration = 15

  return (
    <div
      style={{
        fontFamily,
        width: '100%',
        height: '100%',
      }}
    >
      <TransitionSeries>
        {/* Scene 1: Hero - 90 frames (3 seconds) */}
        <TransitionSeries.Sequence durationInFrames={90}>
          <HeroScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: transitionDuration })}
        />

        {/* Scene 2: Features - 90 frames (3 seconds) */}
        <TransitionSeries.Sequence durationInFrames={90}>
          <FeaturesScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: transitionDuration })}
        />

        {/* Scene 3: Profile Preview - 105 frames (3.5 seconds) */}
        <TransitionSeries.Sequence durationInFrames={105}>
          <ProfilePreviewScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: transitionDuration })}
        />

        {/* Scene 4: Custom Domains (NEW FEATURE) - 120 frames (4 seconds) */}
        <TransitionSeries.Sequence durationInFrames={120}>
          <CustomDomainsScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: transitionDuration })}
        />

        {/* Scene 5: CTA - 105 frames (3.5 seconds) */}
        <TransitionSeries.Sequence durationInFrames={105}>
          <CTAScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </div>
  )
}
