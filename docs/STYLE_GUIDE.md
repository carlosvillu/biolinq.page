# [PROJECT_NAME] Style Guide

Official style guide. **REQUIRED** to follow these specifications for visual consistency.

## Design Philosophy

Clean, minimal design with neutral colors. The template uses **shadcn/ui defaults** for a professional, accessible UI.

- **Colors:** Neutral grays with dark mode support
- **Typography:** System fonts (Inter) for clean, readable UI
- **Components:** Built on shadcn/ui primitives

## UI Component Base

**REQUIRED:** All UI components must be based on [shadcn/ui](https://ui.shadcn.com/).

- Before creating any component, check if a shadcn/ui equivalent exists
- Install necessary components with `npx -y shadcn@latest add <component>`
- Customize shadcn/ui components as needed for your project

## Color Palette

The template uses **shadcn/ui's default neutral palette** with automatic light/dark theme support.

### Using Colors

All colors are defined as CSS variables in `app.css`:

```css
/* Light theme */
--background: 0 0% 100%;
--foreground: 0 0% 3.9%;
--primary: 0 0% 9%;
--primary-foreground: 0 0% 98%;
/* ... etc */
```

### Dark Theme

The dark theme automatically applies when the user selects dark mode or when system preference is dark:

- Theme detection: `prefers-color-scheme` media query
- User can toggle: Light / Dark / System preference
- Theme switcher: Available in Header and Footer components

### Color Usage in Components

- shadcn/ui components use CSS variables automatically
- No need for `dark:` variants in most cases
- Variables adapt automatically when `.dark` class is applied to `<html>`

Example:

```tsx
// This works in both light and dark mode
<button className="bg-primary text-primary-foreground">
  Click me
</button>
```

## Typography

The template uses **Inter** (via Google Fonts) for all text.

```css
font-family: 'Inter', system-ui, -apple-system, sans-serif;
```

### Usage

- **Headings:** Use semantic HTML (`h1`, `h2`, `h3`) with Tailwind size classes
- **Body text:** Default font applies automatically
- **UI elements:** Inherit from shadcn/ui components

## Components

### Buttons

**Primary (Default)**

```tsx
import { Button } from '~/components/ui/button'

<Button>Click me</Button>
```

**Secondary**

```tsx
<Button variant="secondary">Click me</Button>
```

**Ghost**

```tsx
<Button variant="ghost">Click me</Button>
```

### Cards

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    Card content goes here
  </CardContent>
</Card>
```

### Inputs

```tsx
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'

<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="you@example.com" />
</div>
```

### Forms

Always use React Hook Form + Zod validation with shadcn/ui form components:

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'

const schema = z.object({
  email: z.string().email(),
})

export function MyForm() {
  const form = useForm({
    resolver: zodResolver(schema),
  })

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Input {...form.register('email')} />
      <Button type="submit">Submit</Button>
    </form>
  )
}
```

## Layout

### Container

```tsx
<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
  {/* Content */}
</div>
```

### Spacing

Use Tailwind's spacing scale consistently:

- Between sections: `py-12` or `py-16`
- Within sections: `space-y-6` or `space-y-8`
- Between components: `gap-4` for grids/flexbox

### Responsive Design

Use Tailwind's responsive prefixes:

```tsx
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
  {/* Grid items */}
</div>
```

## Navigation

### Header Example

```tsx
<nav className="border-b">
  <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
    <a href="/" className="text-xl font-semibold">
      [PROJECT_NAME]
    </a>
    <div className="flex items-center gap-4">
      <a href="/login">Login</a>
      <Button>Sign up</Button>
    </div>
  </div>
</nav>
```

## Theme Toggle

The template includes a theme toggle component that allows users to switch between light, dark, and system themes.

```tsx
import { ThemeToggle } from '~/components/ThemeToggle'

<ThemeToggle />
```

## Best Practices

### Do:

- Use shadcn/ui components as building blocks
- Follow Tailwind CSS conventions
- Use semantic HTML
- Leverage CSS variables for theming
- Test both light and dark modes

### Don't:

- Hardcode colors (use CSS variables)
- Create custom components when shadcn/ui has an equivalent
- Use inline styles
- Ignore accessibility (use proper ARIA labels, semantic HTML)

## Accessibility

- All interactive elements must be keyboard accessible
- Use proper ARIA labels for screen readers
- Maintain sufficient color contrast (shadcn/ui defaults are WCAG compliant)
- Use semantic HTML elements (`<button>`, `<nav>`, `<main>`, etc.)

## Animation

Use Tailwind's transition utilities sparingly:

```tsx
<button className="transition-colors hover:bg-primary/90">
  Hover me
</button>
```

## Anti-Patterns (NEVER use)

- Hardcoded color values (use CSS variables)
- Custom fonts without good reason (stick to Inter)
- Overly complex animations
- Inconsistent spacing (stick to Tailwind's scale)
- Inaccessible components (missing labels, poor contrast)
