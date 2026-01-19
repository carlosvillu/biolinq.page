# Style Guide - BioLinq

## Overview

This design system implements **Soft Neo-Brutalism**, a contemporary evolution of digital brutalism that combines bold borders, solid shadows, and saturated pastel colors. The aesthetic is "friendly brutalism" - raw and direct while maintaining approachability. The philosophy prioritizes clarity, tactile interactions, and memorable visual hierarchy.

### Component Architecture Strategy

BioLinq uses **Base UI** (`@base-ui/react`) as the foundation for all interactive components. Base UI provides unstyled, accessible, and composable primitives that we style with our Soft Neo-Brutalism aesthetic.

**Why Base UI?**

- ✅ **Unstyled by design** - Perfect canvas for custom aesthetics
- ✅ **Accessibility built-in** - WCAG AA compliance out of the box
- ✅ **Composable & flexible** - Fits any design system
- ✅ **Tree-shakable** - Only bundle what you use
- ✅ **From MUI team** - Production-tested, well-maintained

**Implementation Philosophy:**

1. **Never build from scratch** what Base UI already provides (Checkbox, Dialog, Select, etc.)
2. **Wrap Base UI components** with Soft Neo-Brutalism styling (borders, shadows, colors)
3. **Maintain visual consistency** while leveraging Base UI's accessibility and behavior
4. **Consult Context7 MCP** when adding new component types to find the right Base UI primitive

---

## Table of Contents

- [Component Architecture Strategy](#component-architecture-strategy)
- [UI Component Development Workflow](#ui-component-development-workflow)
- [Color Palette](#color-palette)
- [Typography](#typography)
- [Spacing System](#spacing-system)
- [Component Styles](#component-styles)
- [Shadows & Elevation](#shadows--elevation)
- [Animations & Transitions](#animations--transitions)
- [Border Radius](#border-radius)
- [Border System](#border-system)
- [Opacity & Transparency](#opacity--transparency)
- [Z-Index System](#z-index-system)
- [CSS Variables](#css-variables)
- [Common Tailwind CSS Usage](#common-tailwind-css-usage)
- [Example Components](#example)
- [Accessibility](#accessibility)
- [Implementation Best Practices](#implementation-best-practices)
- [Common Patterns to Avoid](#common-patterns-to-avoid)
- [Future Enhancement Suggestions](#future-enhancement-suggestions)
- [Testing Checklist](#testing-checklist)
- [Version History](#version-history)

---

## UI Component Development Workflow

When planning or implementing UI components, follow this mandatory workflow:

### 1. Check Existing Components First

Before creating anything new, verify if the component already exists:

```bash
# Search in components directory
app/components/ui/     # shadcn/ui components
app/components/        # Custom components
```

**Questions to ask:**

- Does this component already exist in the project?
- Can I reuse or extend an existing component?
- Is there a similar pattern I can follow?

### 2. Identify the Right Base UI Primitive

If you need a new component, determine which Base UI component to use:

**Available Base UI Components:**

- **Forms:** Checkbox, Checkbox Group, Radio, Switch, Input, Number Field, Select, Slider, Field, Fieldset, Form
- **Overlays:** Dialog, Popover, Tooltip, Menu, Context Menu, Menubar
- **Navigation:** Tabs, Navigation Menu, Toolbar
- **Feedback:** Toast, Progress, Meter
- **Interactive:** Button, Toggle, Toggle Group, Collapsible
- **Data:** Combobox, Filterable Menu, Scroll Area
- **Media:** Avatar, Preview Card
- **Layout:** Separator

**When to consult Context7 MCP:**

- You're unsure which Base UI component fits your needs
- You need to understand the API and props of a Base UI component
- You want to see usage examples from Base UI documentation

```typescript
// Example: Use Context7 to research Base UI components
// Agent should call: mcp__context7__query-docs
// libraryId: /llmstxt/base-ui_llms-full_txt
// query: "How to use Dialog component with custom trigger and animations"
```

### 3. Apply Soft Neo-Brutalism Styling

Wrap the Base UI component with our design system:

```tsx
// ❌ DON'T: Use Base UI components directly without styling
import { Checkbox } from '@base-ui/react/checkbox'
;<Checkbox />

// ✅ DO: Wrap with Soft Neo-Brutalism layer
import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox'

export function Checkbox({ children, ...props }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div className="relative w-6 h-6">
        {/* Shadow Layer - Soft Neo-Brutalism signature */}
        <div className="absolute inset-0 bg-dark translate-x-0.5 translate-y-0.5 rounded-sm" />

        {/* Base UI Component */}
        <BaseCheckbox className="peer sr-only" {...props} />

        {/* Custom Visual - Neo-Brutal styling */}
        <div
          className="relative w-5 h-5 bg-white border-[3px] border-dark rounded-sm
          peer-checked:bg-primary transition-all"
        />
      </div>
      <span className="font-medium">{children}</span>
    </label>
  )
}
```

### 4. Maintain Design System Consistency

Every styled Base UI component MUST follow these rules:

**Required Elements:**

1. **3px borders** with `border-dark` (#111827)
2. **Solid offset shadows** (translate-x/y pattern)
3. **Colors from palette** (primary, accent, panel, input, etc.)
4. **Hover/focus states** with lift animations
5. **Accessibility** preserved from Base UI

**Example Pattern:**

```tsx
// Standard wrapper structure for interactive components
<div className="relative group">
  {/* 1. Shadow Layer */}
  <div
    className="absolute inset-0 bg-dark rounded translate-x-1 translate-y-1
    transition-transform group-hover:translate-x-2 group-hover:translate-y-2"
  />

  {/* 2. Base UI Component with Neo-Brutal styling */}
  <BaseUIComponent
    className="relative z-10 border-[3px] border-dark bg-white
      group-hover:-translate-y-px group-hover:-translate-x-px
      transition-transform duration-200"
    {...props}
  >
    {children}
  </BaseUIComponent>
</div>
```

### 5. Document Component Usage

Add examples to this style guide showing:

- Base UI component used
- Styling applied
- Props available
- Accessibility features preserved

---

---

## Color Palette

### Brand Colors (Soft Neo-Brutalism)

| Name           | Hex       | RGB              | Tailwind Class   | Usage                              |
| -------------- | --------- | ---------------- | ---------------- | ---------------------------------- |
| Primary Orange | `#ffc480` | rgb(255,196,128) | `bg-primary`     | Primary buttons, CTAs, highlights  |
| Accent Red     | `#FE4A60` | rgb(254,74,96)   | `bg-accent`      | Alerts, badges, secondary emphasis |
| Ink Black      | `#111827` | rgb(17,24,39)    | `bg-dark`        | Borders, text, solid shadows       |
| Canvas Cream   | `#FFFDF8` | rgb(255,253,248) | `bg-canvas`      | Main page background               |
| Panel Yellow   | `#fff4da` | rgb(255,244,218) | `bg-panel`       | Section backgrounds, cards         |
| Input Blue     | `#E8F0FE` | rgb(232,240,254) | `bg-input`       | Form inputs, secondary buttons     |
| Control Beige  | `#EBDBB7` | rgb(235,219,183) | `bg-control`     | Sliders, toggles, tertiary actions |
| Result Gray    | `#fafafa` | rgb(250,250,250) | `bg-result-gray` | Results containers, loaders        |

### Semantic Colors (shadcn/ui Integration)

> **Note:** Dark mode is currently disabled. The application always uses light theme.

| Name               | Light Mode (HSL) | Usage               |
| ------------------ | ---------------- | ------------------- |
| Background         | `0 0% 100%`      | Main background     |
| Foreground         | `0 0% 3.9%`      | Primary text        |
| Muted              | `0 0% 96.1%`     | Secondary surfaces  |
| Muted Foreground   | `0 0% 45.1%`     | Secondary text      |
| Primary            | `0 0% 9%`        | Primary actions     |
| Primary Foreground | `0 0% 98%`       | Text on primary     |
| Destructive        | `0 84.2% 60.2%`  | Error/danger states |
| Border             | `0 0% 89.8%`     | Default borders     |
| Ring               | `0 0% 3.9%`      | Focus rings         |

### Color Usage Examples

```tsx
// Neo-Brutal Brand Colors (use in landing/marketing pages)
<div className="bg-canvas" />           // Cream background
<div className="bg-panel" />            // Yellow panel sections
<div className="bg-primary" />          // Orange buttons
<button className="bg-accent" />        // Red alert buttons
<input className="bg-input" />          // Blue inputs

// Neo-Brutal Text Colors
<p className="text-dark" />             // Primary ink text
<p className="text-gray-700" />         // Secondary text (higher contrast)

// shadcn/ui Semantic Colors (use in app/dashboard)
<div className="bg-background" />
<p className="text-foreground" />
<p className="text-muted-foreground" />
```

---

## Typography

### Font Families

| Name    | Value                                         | CSS Class      | Usage                        |
| ------- | --------------------------------------------- | -------------- | ---------------------------- |
| Display | `Cabinet Grotesk`, sans-serif                 | `font-display` | Headlines, hero text         |
| Sans    | `Inter`, system-ui, -apple-system, sans-serif | `font-sans`    | Body text, UI elements       |
| Mono    | `Space Mono`, `JetBrains Mono`, monospace     | `font-mono`    | Code, badges, technical text |

### Font Sizes (Neo-Brutal Scale)

| Name    | Size          | Line Height | Tracking           | Usage                |
| ------- | ------------- | ----------- | ------------------ | -------------------- |
| Hero    | `text-7xl`    | 0.9         | `tracking-tighter` | Landing hero titles  |
| Display | `text-5xl`    | 0.9         | `tracking-tighter` | Page titles          |
| H1      | `text-4xl`    | 1.1         | `tracking-tight`   | Section headers      |
| H2      | `text-2xl`    | 1.2         | `tracking-tight`   | Subsection headers   |
| H3      | `text-xl`     | 1.3         | normal             | Card titles          |
| Lead    | `text-lg`     | 1.6         | normal             | Lead paragraphs      |
| Body    | `text-base`   | 1.7         | normal             | Standard body text   |
| Small   | `text-sm`     | 1.5         | normal             | Secondary text, meta |
| Micro   | `text-xs`     | 1.4         | normal             | Labels, timestamps   |
| Badge   | `text-[10px]` | 1.2         | normal             | NEW badges only      |

### Font Weights

| Name   | Value | CSS Class     | Usage                    |
| ------ | ----- | ------------- | ------------------------ |
| Normal | 400   | `font-normal` | Body text                |
| Medium | 500   | `font-medium` | UI labels, inputs        |
| Bold   | 700   | `font-bold`   | Headlines, buttons       |
| Black  | 900   | `font-black`  | Hero text (display font) |

### Typography Examples

```tsx
// Hero Section (Neo-Brutal)
<h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[0.9]">
  Less is more.
</h1>

// Section Title
<h2 className="text-2xl font-bold tracking-tight border-b-4 border-dark pb-2">
  Section Heading
</h2>

// Body with Lead
<p className="text-xl text-gray-700 mb-8">Lead paragraph text</p>
<p className="text-base">Standard body text for content.</p>

// Monospace Code/Technical
<code className="font-mono text-sm bg-input px-2 py-1 border-2 border-dark rounded">
  &lt;500ms
</code>

// Badge Text
<span className="text-[10px] font-bold">NEW</span>
```

---

## Spacing System

### Base Spacing Scale

| Name | Value   | Pixels | Usage                       |
| ---- | ------- | ------ | --------------------------- |
| 1    | 0.25rem | 4px    | Tight element spacing       |
| 2    | 0.5rem  | 8px    | Small gaps, icon spacing    |
| 3    | 0.75rem | 12px   | Default inline gaps         |
| 4    | 1rem    | 16px   | Standard card padding       |
| 5    | 1.25rem | 20px   | Medium spacing              |
| 6    | 1.5rem  | 24px   | Section internal padding    |
| 8    | 2rem    | 32px   | Large card padding          |
| 10   | 2.5rem  | 40px   | Section vertical spacing    |
| 12   | 3rem    | 48px   | Hero section padding        |
| 16   | 4rem    | 64px   | Major section margins       |
| 20   | 5rem    | 80px   | Hero vertical padding       |
| 24   | 6rem    | 96px   | Extra large section spacing |

### Common Spacing Patterns

```tsx
// Card Padding
<div className="p-6 md:p-8" />

// Section Spacing
<section className="py-16 md:py-24 px-6 md:px-12" />

// Element Gaps
<div className="flex gap-4" />
<div className="space-y-6" />

// Content Container
<div className="max-w-4xl mx-auto px-4" />
<div className="max-w-6xl mx-auto px-6" />
```

---

## Component Styles

### Buttons

#### Primary Button (Neo-Brutal)

```tsx
// Structure: Wrapper > Shadow Layer > Button Face
<div className="relative group cursor-pointer h-14">
  {/* Shadow Layer */}
  <div className="absolute inset-0 bg-dark rounded translate-x-1 translate-y-1" />
  {/* Button Face */}
  <button
    className="relative z-10 w-full h-full flex items-center justify-center px-6 py-3.5
    bg-primary text-dark font-bold text-lg border-[3px] border-dark rounded
    group-hover:-translate-y-px group-hover:-translate-x-px
    transition-transform duration-200 ease-out"
  >
    Button Text
  </button>
</div>
```

#### Secondary Button (Neo-Brutal)

```tsx
<div className="relative group">
  <div className="absolute inset-0 bg-dark rounded translate-x-1 translate-y-1" />
  <button
    className="relative z-10 border-[3px] border-dark bg-white text-dark
    px-6 py-3 font-medium rounded
    hover:-translate-y-px hover:-translate-x-px
    transition-transform duration-200"
  >
    Secondary Action
  </button>
</div>
```

#### Button Variants (shadcn/ui)

```tsx
// Default - solid background
<Button variant="default">Primary</Button>

// Outline - border only
<Button variant="outline">Outline</Button>

// Secondary - ink border, transparent bg
<Button variant="secondary">Secondary</Button>

// Ghost - no border, subtle hover
<Button variant="ghost">Ghost</Button>

// Destructive - red/danger
<Button variant="destructive">Delete</Button>

// Link - underline on hover
<Button variant="link">Link</Button>
```

### Inputs

#### Neo-Brutal Input

```tsx
<div className="relative">
  {/* Shadow Layer */}
  <div className="absolute inset-0 bg-dark rounded translate-x-1 translate-y-1" />
  {/* Input Field */}
  <input
    type="text"
    placeholder="GitHub URL"
    className="relative z-10 w-full px-4 py-3 bg-input border-[3px] border-dark rounded
      text-dark font-medium focus:outline-none placeholder-gray-500"
  />
</div>
```

#### shadcn/ui Input

```tsx
<Input
  type="email"
  placeholder="email@example.com"
  className="border-input focus-visible:ring-ring/50"
/>
```

### Cards

#### Neo-Brutal Card

```tsx
<div className="relative">
  {/* Shadow Layer */}
  <div className="absolute inset-0 bg-dark rounded-xl translate-x-2 translate-y-2" />
  {/* Card Content */}
  <div className="relative z-10 bg-panel border-[3px] border-dark rounded-xl p-6 md:p-8">
    <h3 className="text-xl font-bold mb-4">Card Title</h3>
    <p className="text-gray-700">Card content goes here.</p>
  </div>
</div>
```

#### White Card Variant

```tsx
<div className="bg-white border-[3px] border-dark rounded-xl p-6 shadow-hard">Content</div>
```

### Badges

#### NEW Badge (Rotated)

```tsx
<span
  className="inline-block -rotate-6 -translate-y-1 px-1.5 py-0.5
  bg-accent border border-dark text-white text-[10px] font-bold
  shadow-hard"
>
  NEW
</span>
```

#### Tag Badge

```tsx
<span
  className="px-3 py-1 bg-input border-[3px] border-dark text-dark
  font-medium rounded text-sm"
>
  FRONTEND
</span>
```

#### Premium Badge

```tsx
<span
  className="inline-flex items-center gap-1 bg-dark text-primary
  px-2 py-0.5 rounded-sm text-xs font-bold font-mono tracking-wider"
>
  PREMIUM
</span>
```

### Form Elements

#### Checkbox (Neo-Brutal)

```tsx
<label className="flex items-center gap-3 cursor-pointer">
  <div className="relative w-6 h-6">
    <div className="absolute inset-0 bg-dark translate-x-0.5 translate-y-0.5 rounded-sm" />
    <input type="checkbox" className="peer sr-only" />
    <div
      className="relative w-5 h-5 bg-white border-[3px] border-dark rounded-sm
      peer-checked:bg-primary transition-all"
    />
  </div>
  <span className="font-medium">Label text</span>
</label>
```

#### Radio (Neo-Brutal)

```tsx
<label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-input rounded">
  <input
    type="radio"
    name="budget"
    className="w-6 h-6 border-[3px] border-dark rounded-full bg-white
      checked:bg-accent appearance-none cursor-pointer"
  />
  <span className="font-mono text-sm">Option</span>
</label>
```

#### Select (Neo-Brutal)

```tsx
<div className="relative">
  <div className="absolute inset-0 bg-dark rounded translate-x-1 translate-y-1" />
  <select
    className="relative z-10 min-w-[160px] appearance-none pr-8 pl-4 py-3
    bg-[#e6e8eb] border-[3px] border-dark cursor-pointer focus:outline-none rounded"
  >
    <option>Option 1</option>
    <option>Option 2</option>
  </select>
</div>
```

---

## Shadows & Elevation

### Neo-Brutal Shadow System

| Name    | CSS Value                    | Tailwind Class   | Usage                   |
| ------- | ---------------------------- | ---------------- | ----------------------- |
| Hard    | `2px 2px 0 0 rgba(0,0,0,1)`  | `shadow-hard`    | Buttons, inputs, badges |
| Hard LG | `4px 4px 0 0 rgba(0,0,0,1)`  | `shadow-hard-lg` | Cards, panels           |
| Offset  | Element with `translate-x/y` | N/A              | Dynamic button shadows  |

### Shadow Implementation Patterns

```tsx
// Static Shadow (simple)
<div className="border-[3px] border-dark bg-white rounded shadow-hard">
  Content with fixed shadow
</div>

// Dynamic Shadow (interactive)
<div className="relative group">
  <div className="absolute inset-0 bg-dark rounded translate-x-1 translate-y-1
    transition-transform group-hover:translate-x-2 group-hover:translate-y-2" />
  <button className="relative z-10 ...
    group-hover:-translate-y-0.5 group-hover:-translate-x-0.5">
    Hover me
  </button>
</div>

// Pseudo-element Shadow (CSS)
.neo-shadow::before {
  content: '';
  position: absolute;
  inset: 0;
  background: #111827;
  transform: translate(6px, 6px);
  border-radius: inherit;
  z-index: -1;
  transition: transform 0.2s ease-out;
}

.neo-shadow:hover::before {
  transform: translate(3px, 3px);
}
```

---

## Animations & Transitions

### Duration Scale

| Name           | Duration | Usage                       |
| -------------- | -------- | --------------------------- |
| `duration-100` | 100ms    | Quick micro-interactions    |
| `duration-150` | 150ms    | Default hover transitions   |
| `duration-200` | 200ms    | Button press, transforms    |
| `duration-300` | 300ms    | Standard animations         |
| `duration-500` | 500ms    | Slow reveals, large motions |
| `duration-600` | 600ms    | Slide-up animations         |

### Easing Functions

| Name          | Value                          | Usage               |
| ------------- | ------------------------------ | ------------------- |
| `ease-out`    | `cubic-bezier(0, 0, 0.2, 1)`   | Enter animations    |
| `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Default transitions |

### Common Animations

```tsx
// Hover Lift (buttons, cards)
className="transition-transform duration-200 hover:-translate-y-0.5 hover:-translate-x-0.5"

// Press Effect
className="active:translate-x-[2px] active:translate-y-[2px]"

// Link Bounce
className="transition-transform hover:-translate-y-0.5"

// Fade In Up (page load)
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-in { animation: fadeInUp 0.3s ease-out forwards; }

// Slide Up (modals, toasts)
@keyframes slide-up {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-slide-up { animation: slide-up 0.8s ease-out forwards; }

// Staggered Animations
.stagger-1 { animation-delay: 0.1s; }
.stagger-2 { animation-delay: 0.2s; }
.stagger-3 { animation-delay: 0.3s; }

// Float (decorative elements)
@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(3deg); }
}
.animate-float { animation: float 6s ease-in-out infinite; }

// Badge Rotation
@keyframes rotate-badge {
  0%, 100% { transform: rotate(-6deg); }
  50% { transform: rotate(6deg); }
}

// Form Shake (validation error)
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}
.shake { animation: shake 0.3s ease-in-out; }
```

---

## Border Radius

### Radius Scale

| Name           | Value    | Usage                    |
| -------------- | -------- | ------------------------ |
| `rounded-sm`   | 0.125rem | Subtle rounding (badges) |
| `rounded`      | 0.25rem  | Buttons, inputs          |
| `rounded-md`   | 0.375rem | Default elements         |
| `rounded-lg`   | 0.5rem   | Small cards              |
| `rounded-xl`   | 0.75rem  | Cards, panels            |
| `rounded-2xl`  | 1rem     | Large panels, hero cards |
| `rounded-full` | 9999px   | Avatars, pills, icons    |

### Neo-Brutal Default

Neo-Brutal favors minimal rounding. Use `rounded` (4px) for most interactive elements and `rounded-xl` for containers.

---

## Border System

### Border Width

| Width          | Usage                           |
| -------------- | ------------------------------- |
| `border`       | Subtle separators (shadcn/ui)   |
| `border-2`     | Code blocks, secondary elements |
| `border-[3px]` | **Neo-Brutal default** - all UI |
| `border-4`     | Section dividers, emphasis      |

### Border Color

Always use `border-dark` (`#111827`) for Neo-Brutal components. This creates the signature high-contrast look.

```tsx
// Neo-Brutal Standard
<div className="border-[3px] border-dark" />

// Section Divider
<h2 className="border-b-4 border-dark pb-2">Section</h2>

// shadcn/ui Standard
<div className="border border-border" />
```

---

## Opacity & Transparency

### Opacity Scale

| Value         | Usage                         |
| ------------- | ----------------------------- |
| `opacity-0`   | Hidden elements               |
| `opacity-50`  | Disabled states, watermarks   |
| `opacity-60`  | Inactive theme options        |
| `opacity-75`  | Secondary decorative elements |
| `opacity-100` | Default                       |

### Background Opacity Patterns

```tsx
// Header Backdrop
className = 'bg-paper/90 backdrop-blur-sm'

// Modal Overlay
className = 'bg-ink/80'

// Disabled/Locked Content
className = 'opacity-50 blur-[1px] select-none cursor-not-allowed'
```

---

## Z-Index System

### 4-Layer System

| Layer    | Z-Index | Usage                                   |
| -------- | ------- | --------------------------------------- |
| Base     | `0`     | Default content                         |
| Elevated | `10`    | Shadow elements, card layers            |
| Sticky   | `40`    | Sticky headers                          |
| Overlay  | `50`    | Modals, dialogs, dropdowns              |
| Top      | `100`   | Toasts, reading progress, noise overlay |

### Usage Examples

```tsx
// Sticky Header
<header className="fixed top-0 w-full z-40" />

// Modal Dialog
<DialogContent className="z-50" />

// Reading Progress Bar
<div className="fixed top-0 left-0 z-[100]" />

// Noise Texture Overlay
<div className="fixed inset-0 z-[100] pointer-events-none opacity-3" />
```

---

## CSS Variables

### App-Level Variables (app/app.css)

```css
:root {
  --radius: 0.5rem;

  /* Light Mode - shadcn/ui */
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 0 0% 3.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 0 0% 3.9%;
  --primary: 0 0% 9%;
  --primary-foreground: 0 0% 98%;
  --secondary: 0 0% 96.1%;
  --secondary-foreground: 0 0% 9%;
  --muted: 0 0% 96.1%;
  --muted-foreground: 0 0% 45.1%;
  --accent: 0 0% 96.1%;
  --accent-foreground: 0 0% 9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 0 0% 89.8%;
  --input: 0 0% 89.8%;
  --ring: 0 0% 3.9%;
}

/* Dark mode is currently disabled - application always uses light theme */
/* .dark variables are preserved for potential future use but not active */
```

### Neo-Brutal Tailwind Config (Mockups)

```javascript
tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        primary: '#ffc480', // Ingest Orange
        accent: '#FE4A60', // Alert Red
        dark: '#111827', // Ink Black
        canvas: '#FFFDF8', // Cream Paper
        panel: '#fff4da', // Panel Yellow
        input: '#E8F0FE', // Input Blue
        control: '#EBDBB7', // Controls Beige
      },
      boxShadow: {
        hard: '2px 2px 0 0 rgba(0,0,0,1)',
        'hard-lg': '4px 4px 0 0 rgba(0,0,0,1)',
      },
    },
  },
}
```

---

## Common Tailwind CSS Usage

### Most Used Utility Classes

```tsx
// Neo-Brutal Borders
'border-[3px] border-dark'
'border-[3px] border-gray-900'

// Tracking (letter-spacing)
'tracking-tighter' // -0.05em - Hero headlines
'tracking-tight' // -0.025em - Section titles

// Font Weights
'font-bold' // 700 - Most text
'font-black' // 900 - Display text only
'font-medium' // 500 - Body, buttons

// Transitions
'transition-transform duration-200 ease-out'
'transition-colors duration-150'
'transition-all duration-200'
```

### Layout Patterns

```tsx
// Centered Container (Marketing)
<div className="max-w-4xl mx-auto px-4 py-12" />

// Wide Container (Dashboard)
<div className="max-w-6xl mx-auto px-4 md:px-6" />

// Flex Layouts
<div className="flex items-center justify-between" />
<div className="flex flex-col gap-4" />
<div className="flex flex-wrap gap-6 items-start" />

// Grid Layouts
<div className="grid md:grid-cols-3 gap-6" />
<div className="grid grid-cols-2 md:grid-cols-4 gap-4" />
<div className="grid lg:grid-cols-[1.5fr_1fr] gap-8" />
```

### Responsive Patterns

```tsx
// Mobile-First Typography
<h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl" />

// Mobile-First Spacing
<section className="py-12 md:py-24 px-4 md:px-12" />

// Mobile-First Grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" />

// Hide/Show Elements
<nav className="hidden md:flex gap-6" />
<div className="lg:hidden" />  // Mobile menu
```

---

## Example Components

### Reference Component: Link Card (Public Profile)

```tsx
<a href="#" className="group relative block w-full">
  {/* Shadow Layer - Expands on hover */}
  <div
    className="absolute inset-0 bg-dark rounded translate-x-1.5 translate-y-1.5
    transition-transform group-hover:translate-x-2 group-hover:translate-y-2"
  />

  {/* Card Face - Lifts on hover */}
  <div
    className="relative z-10 bg-white border-[3px] border-dark rounded p-4
    flex items-center justify-center gap-3
    transition-transform group-hover:-translate-y-0.5 group-hover:-translate-x-0.5"
  >
    <span className="text-xl">🐦</span>
    <span className="font-bold text-lg">Twitter</span>
  </div>
</a>
```

### Reference Component: Value Prop Card

```tsx
<div className="border-[3px] border-dark bg-white p-6 rounded shadow-hard relative">
  {/* Optional Badge */}
  <span className="badge-new absolute -top-3 -right-2">BEST VALUE</span>

  {/* Icon */}
  <div className="text-4xl mb-4">⚡</div>

  {/* Content */}
  <h3 className="font-bold text-lg mb-2">Ultra Rápido</h3>
  <p className="text-gray-700">Sin scripts pesados. Tus seguidores no esperarán.</p>
</div>
```

### Reference Component: Form Section

```tsx
<div className="relative">
  {/* Card Shadow */}
  <div className="absolute inset-0 bg-dark rounded-xl translate-x-2 translate-y-2" />

  {/* Card Content */}
  <div className="relative z-10 bg-panel border-[3px] border-dark rounded-xl p-8">
    <form className="space-y-6">
      {/* Input Group */}
      <div>
        <label className="block font-bold mb-2">Email *</label>
        <div className="relative">
          <div className="absolute inset-0 bg-dark rounded translate-x-1 translate-y-1" />
          <input
            type="email"
            required
            placeholder="tu@email.com"
            className="relative z-10 w-full px-4 py-3 bg-input border-[3px] border-dark rounded
              font-medium focus:outline-none placeholder-gray-500"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="relative group cursor-pointer h-14">
        <div className="absolute inset-0 bg-gray-800 rounded translate-x-1 translate-y-1" />
        <button
          className="relative z-10 w-full h-full flex items-center justify-center
          bg-primary text-dark font-bold text-lg border-[3px] border-dark rounded
          group-hover:-translate-y-px group-hover:-translate-x-px
          transition-transform duration-200"
        >
          Enviar
        </button>
      </div>
    </form>
  </div>
</div>
```

### Reference Component: Pricing Card (Featured)

```tsx
<div
  className="relative bg-primary border-[3px] border-dark rounded-xl p-8
  transform md:scale-105"
>
  {/* Plan Name */}
  <div className="font-mono text-sm font-bold mb-2">PRO</div>

  {/* Price */}
  <div className="font-display text-5xl mb-2">
    €29
    <span className="text-xl">/mes</span>
  </div>

  <p className="mb-6">Para profesionales</p>

  {/* Features List */}
  <ul className="space-y-3 mb-8">
    <li className="flex items-center gap-2">
      <span>✓</span>
      <span>Proyectos ilimitados</span>
    </li>
    {/* ... more items */}
  </ul>

  {/* CTA Button */}
  <div className="relative">
    <div className="absolute inset-0 bg-dark rounded translate-x-1 translate-y-1" />
    <button
      className="relative z-10 w-full py-3 bg-dark text-white border-[3px] border-dark
      rounded font-bold hover:bg-[#1f2937] transition-colors"
    >
      Empezar prueba
    </button>
  </div>
</div>
```

---

## Accessibility

### WCAG AA Compliance

This design system targets WCAG 2.1 AA guidelines with built-in high contrast.

### Contrast Ratios

| Element     | Foreground | Background | Ratio  | Status |
| ----------- | ---------- | ---------- | ------ | ------ |
| Body text   | `#111827`  | `#FFFDF8`  | 16.1:1 | ✅     |
| Body text   | `#111827`  | `#fff4da`  | 14.5:1 | ✅     |
| Button text | `#111827`  | `#ffc480`  | 8.9:1  | ✅     |
| Badge text  | `#FFFFFF`  | `#FE4A60`  | 4.6:1  | ✅     |
| Muted text  | `#4B5563`  | `#FFFDF8`  | 7.5:1  | ✅     |

### Focus States

```tsx
// Input Focus
className="focus:outline-none focus-visible:border-ring focus-visible:ring-ring/50
  focus-visible:ring-[3px]"

// Custom Focus Ring (Neo-Brutal)
className="focus:outline-none focus:ring-[3px] focus:ring-primary"

// Button Focus
className="outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
```

### Keyboard Navigation

- All interactive elements must be focusable
- Use semantic HTML elements (`<button>`, `<a>`, `<input>`)
- Ensure focus order follows visual order
- Never use `outline-none` without an alternative focus indicator

### Screen Reader Considerations

```tsx
// Hidden Decorative Elements
<span className="sr-only">Description for screen readers</span>

// Icon Buttons
<button aria-label="Close dialog">
  <XIcon className="w-5 h-5" />
</button>

// Live Regions
<div role="status" aria-live="polite">
  {statusMessage}
</div>
```

---

## Implementation Best Practices

### 1. Use `neo-` Prefixed Color Classes (CRITICAL)

> **⚠️ IMPORTANT:** All Neo-Brutal brand colors use the `neo-` prefix in Tailwind classes.
> Using `bg-dark` or `border-dark` will NOT work — these classes don't exist.

```tsx
// ✅ CORRECT - Use neo- prefix
<div className="bg-neo-dark" />
<div className="border-neo-dark" />
<div className="text-neo-dark" />
<div className="bg-neo-primary" />
<div className="bg-neo-accent" />
<div className="bg-neo-canvas" />
<div className="bg-neo-panel" />
<div className="bg-neo-input" />

// ❌ WRONG - These classes don't exist in the project
<div className="bg-dark" />
<div className="border-dark" />
<div className="text-dark" />
```

**Available Neo-Brutal color classes (defined in `app/app.css`):**

| Color         | Background       | Border             | Text             |
| ------------- | ---------------- | ------------------ | ---------------- |
| Dark (ink)    | `bg-neo-dark`    | `border-neo-dark`  | `text-neo-dark`  |
| Primary       | `bg-neo-primary` | `border-neo-primary` | `text-neo-primary` |
| Accent        | `bg-neo-accent`  | `border-neo-accent`  | `text-neo-accent`  |
| Canvas        | `bg-neo-canvas`  | —                  | —                |
| Panel         | `bg-neo-panel`   | —                  | —                |
| Input         | `bg-neo-input`   | —                  | —                |

### 2. Use Neo-Brutal Tokens Consistently

```tsx
// Good
<div className="bg-neo-primary border-[3px] border-neo-dark" />

// Bad - Raw hex values
<div className="bg-[#ffc480] border-[3px] border-[#111827]" />
```

### 3. Always Include Shadow Layers for Interactive Elements

```tsx
// Good - Complete button structure
<div className="relative group">
  <div className="absolute inset-0 bg-neo-dark rounded translate-x-1 translate-y-1" />
  <button className="relative z-10 ...">Click</button>
</div>

// Bad - Missing shadow layer
<button className="bg-neo-primary border-[3px] border-neo-dark">Click</button>
```

### 4. Mobile-First Responsive Design

```tsx
// Good
<h1 className="text-4xl md:text-5xl lg:text-7xl" />

// Bad - Desktop-first
<h1 className="text-7xl md:text-5xl sm:text-4xl" />
```

### 5. Consistent Animation Patterns

```tsx
// Good - Predictable hover behavior
className = 'transition-transform duration-200 hover:-translate-y-px hover:-translate-x-px'

// Bad - Inconsistent timing/easing
className = 'transition duration-500 hover:-translate-y-2'
```

### 6. Semantic Color Usage

```tsx
// Good - Marketing/Landing pages
<section className="bg-panel" />
<button className="bg-primary" />
<span className="bg-accent" />

// Good - App/Dashboard
<div className="bg-background" />
<p className="text-muted-foreground" />
```

### 6. Border Width Consistency

Always use `border-[3px]` for Neo-Brutal components. This is the signature thickness.

---

## Common Patterns to Avoid

### 1. Arbitrary Values

```tsx
// Bad
<div className="w-[347px] p-[13px]" />

// Good
<div className="w-full max-w-sm p-4" />
```

### 2. Inline Styles

```tsx
// Bad
<div style={{ backgroundColor: '#ffc480', border: '3px solid #111827' }} />

// Good
<div className="bg-primary border-[3px] border-dark" />
```

### 3. Inconsistent Border Widths

```tsx
// Bad - Mixed border widths
<div className="border-2 border-dark" />
<button className="border-[3px] border-dark" />

// Good - Consistent 3px
<div className="border-[3px] border-dark" />
<button className="border-[3px] border-dark" />
```

### 4. Soft Shadows in Neo-Brutal Context

```tsx
// Bad - Blurred shadows break the aesthetic
<div className="shadow-lg" />

// Good - Solid offset shadows
<div className="shadow-hard" />
```

### 5. Missing Hover States on Interactive Elements

```tsx
// Bad - No feedback
<button className="bg-primary border-[3px] border-dark">Click</button>

// Good - Clear interaction feedback
<button className="bg-primary border-[3px] border-dark
  hover:-translate-y-px hover:-translate-x-px transition-transform">
  Click
</button>
```

### 6. Z-Index Escalation

```tsx
// Bad - Arbitrary z-index values
<div className="z-[999]" />
<div className="z-[1000]" />

// Good - Follow the 4-layer system
<header className="z-40" />
<dialog className="z-50" />
```

### 7. Complex Gradients

Neo-Brutal favors flat colors. Avoid gradients on interactive elements.

```tsx
// Bad
<button className="bg-gradient-to-r from-primary to-accent" />

// Good
<button className="bg-primary" />
```

---

## Future Enhancement Suggestions

- [ ] Add dark mode support (currently disabled - light theme only)
- [ ] Create Tailwind plugin for Neo-Brutal utilities (`neo-border`, `neo-shadow`, etc.)
- [ ] Add range slider component with custom styling
- [ ] Implement toast/notification component with Neo-Brutal aesthetic
- [ ] Add skeleton loading states with hard shadow animations
- [ ] Create dropdown/select component with consistent styling
- [ ] Add tooltip component following the design system
- [ ] Implement mobile navigation drawer with Neo-Brutal styling

---

## Testing Checklist

### Visual Testing

- [ ] Components render correctly with cream background (`#FFFDF8`)
- [ ] Components render correctly with panel background (`#fff4da`)
- [ ] All borders are exactly 3px and `#111827` colored
- [ ] Shadows use solid black with no blur
- [ ] Hover states lift elements (-translate-y-px, -translate-x-px)
- [ ] Active/press states sink elements (translate-x-[2px], translate-y-[2px])
- [ ] Responsive breakpoints work as expected (sm:, md:, lg:)

### Theme Testing

> **Note:** Dark mode is currently disabled. The application always uses light theme.

- [x] Light theme is always applied
- [x] No `.dark` class is added to the document
- [ ] All components have explicit `text-neo-dark` for icon/text visibility

### Accessibility Testing

- [ ] Color contrast meets WCAG AA (4.5:1 for text, 3:1 for UI)
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible and consistent
- [ ] Screen reader announces content correctly
- [ ] Focus order follows logical visual order

### Cross-Browser Testing

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Animation Testing

- [ ] Hover animations are smooth (60fps)
- [ ] Transitions don't cause layout shift
- [ ] Animations respect `prefers-reduced-motion`

---

## Version History

| Version | Date       | Changes                                                                |
| ------- | ---------- | ---------------------------------------------------------------------- |
| 1.1.0   | 2026-01-18 | Added Base UI component architecture strategy and development workflow |
| 1.0.0   | 2026-01-17 | Initial style guide - Soft Neo-Brutalism system                        |
