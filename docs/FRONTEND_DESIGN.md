# Frontend Design Skill

Create distinctive, production-grade frontend interfaces with high design quality. Use this guide when building web components, pages, or applications. Generate creative, polished code that avoids generic AI aesthetics.

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:

- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work—the key is intentionality, not intensity.

## Implementation Standards

Code must be:

- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Aesthetics Guidelines

### Typography

Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt for distinctive choices that elevate aesthetics. Pair a distinctive display font with a refined body font.

### Color & Theme

Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.

### Motion

Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals creates more delight than scattered micro-interactions.

### Spatial Composition

Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.

### Backgrounds & Visual Details

Create atmosphere and depth rather than defaulting to solid colors. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.

### Artwork & Cover Previews

When rendering real-world covers (podcast artwork, album art, etc.), prioritize **fidelity** over strict aspect-ratio crops:

- Use a container that centers the image: `flex items-center justify-center` with a subtle border/background.
- Prefer `max-w-full h-auto object-contain` for the `<img>` so the full cover is visible on small screens.
- Avoid forcing `aspect-video` + `object-cover` for covers coming from external feeds; this can crop important parts of the artwork on mobile.
- Test cover previews in narrow viewports (320–400px) to ensure they don’t introduce horizontal scroll and the composition still feels editorial.

## Anti-Patterns (NEVER Use)

- Generic font families (Inter, Roboto, Arial, system fonts)
- Cliched color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character
- Converging on common choices (Space Grotesk, etc.) across generations

## Execution Principle

Match implementation complexity to the aesthetic vision:

- **Maximalist designs** → Elaborate code with extensive animations and effects
- **Minimalist designs** → Restraint, precision, careful attention to spacing, typography, and subtle details

Elegance comes from executing the vision well. Vary between light and dark themes, different fonts, different aesthetics. No design should be the same.
