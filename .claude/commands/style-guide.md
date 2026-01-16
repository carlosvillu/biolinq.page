---
allowed-tools: Read, Write, Glob, Grep, Bash
description: Analyze project and generate comprehensive style guide from mockups
---

## Instructions

You are a senior UI/UX designer and frontend architect tasked with analyzing the current project and generating a comprehensive style guide.

### Step 1: Clean Previous Style Guide

First, check if `docs/STYLE_GUIDE.md` exists and delete it to generate a fresh version:

```bash
rm -f docs/STYLE_GUIDE.md
```

### Step 2: Read Mockup Files

Read ALL files in the `mockups/` directory to understand the design patterns:

```
Glob mockups/**/*
```

Read each file found to extract design information.

### Step 3: Analyze Project Styles

Explore the existing codebase to extract style patterns:

1. **Tailwind Config:**
   ```
   Read tailwind.config.ts (or tailwind.config.js)
   ```

2. **CSS Variables:**
   ```
   Glob app/**/*.css
   ```
   Read each CSS file to extract custom properties.

3. **Component Patterns:**
   ```
   Glob app/components/**/*.tsx
   ```
   Read components to identify common patterns.

4. **UI Library Components (shadcn/ui):**
   ```
   Glob app/components/ui/**/*.tsx
   ```

### Step 4: Generate Style Guide

Create `docs/STYLE_GUIDE.md` with the following comprehensive structure:

```markdown
# Style Guide - [Project Name]

## Overview
Brief description of the design system philosophy and principles.

---

## Table of Contents
- [Color Palette](#color-palette)
- [Typography](#typography)
- [Spacing System](#spacing-system)
- [Component Styles](#component-styles)
- [Shadows & Elevation](#shadows--elevation)
- [Animations & Transitions](#animations--transitions)
- [Border Radius](#border-radius)
- [Opacity & Transparency](#opacity--transparency)
- [Z-Index System](#z-index-system)
- [CSS Variables](#css-variables)
- [Common Tailwind CSS Usage](#common-tailwind-css-usage)
- [Example Components](#example-components)
- [Accessibility](#accessibility)
- [Implementation Best Practices](#implementation-best-practices)
- [Common Patterns to Avoid](#common-patterns-to-avoid)
- [Future Enhancement Suggestions](#future-enhancement-suggestions)
- [Testing Checklist](#testing-checklist)
- [Version History](#version-history)

---

## Color Palette

### Primary Colors
| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| [Color Name] | #XXXXXX | rgb(X, X, X) | [Description] |

### Secondary Colors
...

### Semantic Colors
| Name | Light Mode | Dark Mode | Usage |
|------|------------|-----------|-------|
| Background | #XXXXXX | #XXXXXX | Main background |
| Foreground | #XXXXXX | #XXXXXX | Primary text |
| Muted | #XXXXXX | #XXXXXX | Secondary text |
| Accent | #XXXXXX | #XXXXXX | Highlights |
| Destructive | #XXXXXX | #XXXXXX | Error states |

### Color Usage Examples
\`\`\`tsx
// Background colors
<div className="bg-background" />
<div className="bg-muted" />

// Text colors
<p className="text-foreground" />
<p className="text-muted-foreground" />
\`\`\`

---

## Typography

### Font Families
| Name | Value | Usage |
|------|-------|-------|
| Sans | [Font Stack] | Body text, UI elements |
| Mono | [Font Stack] | Code blocks |

### Font Sizes
| Name | Size | Line Height | Usage |
|------|------|-------------|-------|
| xs | Xpx / Xrem | X | Small labels |
| sm | Xpx / Xrem | X | Secondary text |
| base | Xpx / Xrem | X | Body text |
| lg | Xpx / Xrem | X | Subheadings |
| xl | Xpx / Xrem | X | Section titles |
| 2xl | Xpx / Xrem | X | Page titles |
| 3xl | Xpx / Xrem | X | Hero text |

### Font Weights
| Name | Value | Usage |
|------|-------|-------|
| normal | 400 | Body text |
| medium | 500 | Emphasis |
| semibold | 600 | Subheadings |
| bold | 700 | Headings |

### Typography Examples
\`\`\`tsx
<h1 className="text-3xl font-bold tracking-tight">Page Title</h1>
<h2 className="text-2xl font-semibold">Section Title</h2>
<p className="text-base text-muted-foreground">Body text</p>
<span className="text-sm font-medium">Label</span>
\`\`\`

---

## Spacing System

### Base Spacing Scale
| Name | Value | Pixels | Usage |
|------|-------|--------|-------|
| 0 | 0 | 0px | Reset |
| 1 | 0.25rem | 4px | Tight spacing |
| 2 | 0.5rem | 8px | Small gaps |
| 3 | 0.75rem | 12px | Default gaps |
| 4 | 1rem | 16px | Standard padding |
| 5 | 1.25rem | 20px | Medium spacing |
| 6 | 1.5rem | 24px | Section gaps |
| 8 | 2rem | 32px | Large spacing |
| 10 | 2.5rem | 40px | XL spacing |
| 12 | 3rem | 48px | Section margins |
| 16 | 4rem | 64px | Hero spacing |

### Common Spacing Patterns
\`\`\`tsx
// Card padding
<Card className="p-4 md:p-6" />

// Section margins
<section className="my-8 md:my-12" />

// Element gaps
<div className="flex gap-2" />
<div className="space-y-4" />
\`\`\`

---

## Component Styles

### Buttons
[Document all button variants with code examples]

### Cards
[Document card patterns with code examples]

### Forms
[Document form patterns with code examples]

### Navigation
[Document navigation patterns with code examples]

---

## Shadows & Elevation

### Shadow Scale
| Name | CSS Value | Usage |
|------|-----------|-------|
| shadow-sm | [value] | Subtle elevation |
| shadow | [value] | Default cards |
| shadow-md | [value] | Elevated cards |
| shadow-lg | [value] | Modals, dropdowns |
| shadow-xl | [value] | Floating elements |

### Usage Examples
\`\`\`tsx
<Card className="shadow-sm hover:shadow-md transition-shadow" />
<Dialog className="shadow-xl" />
\`\`\`

---

## Animations & Transitions

### Duration Scale
| Name | Duration | Usage |
|------|----------|-------|
| duration-75 | 75ms | Micro interactions |
| duration-100 | 100ms | Quick feedback |
| duration-150 | 150ms | Default transitions |
| duration-200 | 200ms | Smooth transitions |
| duration-300 | 300ms | Complex animations |
| duration-500 | 500ms | Slow reveals |

### Easing Functions
| Name | Value | Usage |
|------|-------|-------|
| ease-in | cubic-bezier(0.4, 0, 1, 1) | Exit animations |
| ease-out | cubic-bezier(0, 0, 0.2, 1) | Enter animations |
| ease-in-out | cubic-bezier(0.4, 0, 0.2, 1) | Default |

### Common Transitions
\`\`\`tsx
// Hover effects
className="transition-colors duration-150"
className="transition-shadow duration-200"
className="transition-transform duration-200 hover:scale-105"

// Opacity transitions
className="transition-opacity duration-300"
\`\`\`

---

## Border Radius

### Radius Scale
| Name | Value | Usage |
|------|-------|-------|
| rounded-none | 0 | Sharp corners |
| rounded-sm | 0.125rem | Subtle rounding |
| rounded | 0.25rem | Default |
| rounded-md | 0.375rem | Medium |
| rounded-lg | 0.5rem | Cards |
| rounded-xl | 0.75rem | Large cards |
| rounded-2xl | 1rem | Hero sections |
| rounded-full | 9999px | Pills, avatars |

---

## Opacity & Transparency

### Opacity Scale
| Value | Usage |
|-------|-------|
| opacity-0 | Hidden elements |
| opacity-50 | Disabled states |
| opacity-75 | Secondary elements |
| opacity-100 | Default |

### Background Opacity Patterns
\`\`\`tsx
// Overlays
className="bg-black/50"  // 50% black overlay
className="bg-white/80"  // 80% white overlay

// Muted backgrounds
className="bg-muted/50"
\`\`\`

---

## Z-Index System

### 4-Layer System
| Layer | Z-Index | Usage |
|-------|---------|-------|
| Base | 0 | Default content |
| Elevated | 1 | Cards, dropdowns |
| Overlay | 2 | Modals, sheets |
| Top | 100 | Toasts, tooltips |

### Usage Guidelines
\`\`\`tsx
// Layer 0 - Base content (default, no z-index needed)
<main className="relative" />

// Layer 1 - Elevated elements
<DropdownMenu className="z-[1]" />

// Layer 2 - Overlays
<Dialog className="z-[2]" />
<Sheet className="z-[2]" />

// Layer 100 - Always on top
<Toast className="z-[100]" />
<Tooltip className="z-[100]" />
\`\`\`

---

## CSS Variables

### Header Heights
\`\`\`css
:root {
  --header-height: [value];
  --mobile-header-height: [value];
}
\`\`\`

### Spacing Values
\`\`\`css
:root {
  --content-padding: [value];
  --section-gap: [value];
}
\`\`\`

### Colors
\`\`\`css
:root {
  --background: [value];
  --foreground: [value];
  --card: [value];
  --card-foreground: [value];
  --primary: [value];
  --primary-foreground: [value];
  --secondary: [value];
  --secondary-foreground: [value];
  --muted: [value];
  --muted-foreground: [value];
  --accent: [value];
  --accent-foreground: [value];
  --destructive: [value];
  --destructive-foreground: [value];
  --border: [value];
  --input: [value];
  --ring: [value];
}
\`\`\`

---

## Common Tailwind CSS Usage

### Most Used Utility Classes
[List and explain the most frequently used Tailwind classes in the project]

### Layout Patterns
\`\`\`tsx
// Centered container
<div className="container mx-auto px-4" />

// Flex layouts
<div className="flex items-center justify-between" />
<div className="flex flex-col gap-4" />

// Grid layouts
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" />
\`\`\`

### Responsive Patterns
\`\`\`tsx
// Mobile-first responsive
<div className="p-4 md:p-6 lg:p-8" />
<div className="text-sm md:text-base" />
<div className="hidden md:block" />
\`\`\`

---

## Example Components

### Reference Component: [Component Name]
\`\`\`tsx
// Full implementation example from the codebase
[Include actual code from the project]
\`\`\`

[Add more example components as found in mockups/]

---

## Accessibility

### WCAG AA Compliance
This design system follows WCAG 2.1 AA guidelines.

### Contrast Ratios
| Element | Contrast Ratio | Requirement | Status |
|---------|---------------|-------------|--------|
| Body text | X:1 | 4.5:1 min | ✅ |
| Large text | X:1 | 3:1 min | ✅ |
| UI components | X:1 | 3:1 min | ✅ |

### Focus States
\`\`\`tsx
// Focus ring pattern
className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
\`\`\`

### Screen Reader Considerations
- Use semantic HTML elements
- Include proper ARIA labels
- Ensure keyboard navigation works

---

## Implementation Best Practices

1. **Use Design Tokens:** Always use CSS variables and Tailwind classes instead of hardcoded values.

2. **Mobile-First:** Start with mobile styles and add responsive modifiers.

3. **Consistent Spacing:** Use the spacing scale, avoid arbitrary values.

4. **Semantic Colors:** Use semantic color names (primary, destructive) instead of raw colors.

5. **Component Composition:** Build complex UI from small, reusable components.

6. **Dark Mode Support:** Always define both light and dark mode styles.

---

## Common Patterns to Avoid

1. **Arbitrary Values:** Avoid `w-[347px]`, use design tokens instead.

2. **Inline Styles:** Use Tailwind classes, not inline style attributes.

3. **Inconsistent Spacing:** Don't mix spacing values arbitrarily.

4. **Hardcoded Colors:** Never use raw hex values in components.

5. **Z-Index Wars:** Stick to the 4-layer system.

6. **Missing Focus States:** Always include keyboard focus indicators.

---

## Future Enhancement Suggestions

- [ ] [Enhancement suggestion 1]
- [ ] [Enhancement suggestion 2]
- [ ] [Enhancement suggestion 3]

---

## Testing Checklist

### Visual Testing
- [ ] Components render correctly in light mode
- [ ] Components render correctly in dark mode
- [ ] Responsive breakpoints work as expected
- [ ] Hover/focus states are visible

### Accessibility Testing
- [ ] Color contrast meets WCAG AA
- [ ] All interactive elements are keyboard accessible
- [ ] Screen reader announces content correctly
- [ ] Focus order is logical

### Cross-Browser Testing
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | [Date] | Initial style guide |
```

### Important Guidelines

1. **Extract Real Values:** All values in the style guide MUST be extracted from the actual project files (CSS, config, components). Do not use placeholder values.

2. **Include Real Code Examples:** The example components section MUST include actual code from the project's mockups/ or components/ directories.

3. **Document Everything Found:** If you discover patterns not listed in this template, add them to the style guide.

4. **Be Comprehensive:** The style guide should be complete enough that a new developer can implement any UI element consistently.

5. **Include Mockup Analysis:** Document specific design decisions found in the mockups/ folder.

**Start by checking for and removing any existing STYLE_GUIDE.md, then read all mockup files.**
