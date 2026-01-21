import { Composition, Folder } from 'remotion'

import { BioLinqPromo } from './compositions/BioLinqPromo'

export const RemotionRoot = () => {
  return (
    <Folder name="Marketing">
      <Composition
        id="BioLinqPromo"
        component={BioLinqPromo}
        durationInFrames={450}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: 'BioLinq.page',
          tagline: 'El Linktree minimalista',
        }}
      />
    </Folder>
  )
}
