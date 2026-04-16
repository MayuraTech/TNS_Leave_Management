---
inclusion: auto
description: UI design system guidelines for TNS Leave Management Portal including brand colors, typography, spacing, animations, and component patterns
---

# UI Design System — TNS Leave Management Portal

## Brand Color Palette

The palette uses indigo/dark blue as the primary brand color with complementary accent colors for various UI states and components.

### CSS Custom Properties

```css
:root {
  /* Primary Brand Colors — Indigo/Dark Blue */
  --color-primary-900: #29196f;
  --color-primary-800: #3f476e;
  --color-primary-700: #181c80;
  --color-primary-600: #2c3e50;
  --color-primary-500: #334155;
  --color-primary-400: #34495e;

  /* Accent Blue */
  --color-accent-blue-700: #3498db;
  --color-accent-blue-600: #409eff;
  --color-accent-blue-500: #4E92F8;
  --color-accent-blue-400: #6e6eff;
  --color-accent-blue-300: #62C3FA;

  /* Soft Teal/Green */
  --color-teal-500: #95B9C7;
  --color-teal-400: #99EDC3;
  --color-teal-300: #B9C66A;
  --color-teal-200: #A9D08E;

  /* Purple/Pink */
  --color-purple-600: #CC7AF2;
  --color-purple-500: #FF6EC7;
  --color-purple-400: #fac4e6;
  --color-purple-300: #F44EBC;

  /* Orange/Warning */
  --color-warning-700: #ff4d00;
  --color-warning-600: #F49D78;
  --color-warning-500: #ff4f4f;

  /* Red/Error */
  --color-danger-900: #b70024;
  --color-danger-700: #e5087f;
  --color-danger-600: #fb3434;
  --color-danger-500: #ef4444;

  /* Disabled/Secondary State */
  --color-disabled: #c9c9c9;

  /* Neutral/Background Colors */
  --color-white: #ffffff;
  --color-neutral-50: #fafafa;
  --color-neutral-100: #f8f9fa;
  --color-neutral-150: #f6f6f6;
  --color-neutral-200: #f1f1f1;
  --color-neutral-250: #fff5f5;
  --color-neutral-300: #f0f2f5;
  --color-neutral-350: #f0f7ff;
  --color-neutral-400: #f1f3f5;
  --color-neutral-450: #e7e5e5;
  --color-neutral-500: #e0e0e0;
  --color-neutral-550: #dcdfe6;
  --color-neutral-600: #ccc;
  --color-neutral-650: #c0c0c0;
  --color-neutral-700: #bdbdbd;
  --color-neutral-750: #b8b5b5;

  /* Soft Backgrounds */
  --color-bg-indigo-light: #d6ddf9;
  --color-bg-indigo-lighter: #d6d6ff;
  --color-bg-blue-light: #cae7f6;
  --color-bg-blue-lighter: #b3c3e6;
  --color-bg-blue-lightest: #b3d9ff;
  --color-bg-blue-pale: #D9E1F2;
  --color-bg-purple-light: #d0c7de;
  --color-bg-grey-light: #e3e0e0;
  --color-bg-pink-light: #f9c5f9;
  --color-bg-pink-lighter: #fae6e7;
  --color-bg-red-light: #fee2e2;

  /* Semantic Colors */
  --color-success: #A9D08E;
  --color-success-light: #99EDC3;
  --color-info: #4E92F8;
  --color-info-light: #b3d9ff;

  /* Surface & Background */
  --surface-primary: #ffffff;
  --surface-secondary: #f8f9fa;
  --surface-elevated: #ffffff;
  --surface-dark: #3f476e;
  --surface-dark-secondary: #29196f;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(63, 71, 110, 0.06);
  --shadow-md: 0 4px 12px rgba(63, 71, 110, 0.08);
  --shadow-lg: 0 12px 32px rgba(63, 71, 110, 0.12);
  --shadow-xl: 0 20px 48px rgba(63, 71, 110, 0.16);
  --shadow-glow-accent: 0 0 24px rgba(78, 146, 248, 0.2);
}
```

## Typography

Use distinctive, characterful fonts — avoid generic choices.

```css
:root {
  /* Display / Headings — bold, architectural feel */
  --font-display: 'Clash Display', 'Satoshi', sans-serif;

  /* Body — refined, highly readable */
  --font-body: 'General Sans', 'Outfit', sans-serif;

  /* Mono — for reference numbers, codes */
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Scale */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;
  --text-5xl: 3rem;

  /* Weights */
  --font-regular: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  /* Line heights */
  --leading-tight: 1.2;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;

  /* Letter spacing */
  --tracking-tight: -0.02em;
  --tracking-normal: 0;
  --tracking-wide: 0.025em;
  --tracking-wider: 0.05em;
}
```

Font sources: Use Google Fonts or Fontshare (free). Load via `@import` or `<link>` in `index.html`.

## Spatial Composition

- Use generous whitespace — let content breathe
- Sidebar navigation: fixed left, dark navy (`--color-primary-900`)
- Main content area: light surface with subtle warm tint
- Cards: white with `--shadow-md`, 12px border-radius, subtle left-border accent in amber
- Grid-breaking hero sections on dashboard with diagonal clip-paths or overlapping elements
- Status badges: pill-shaped with semantic colors, slight backdrop blur

### Spacing Scale
```css
:root {
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-20: 5rem;
}
```

## Motion & Animations

- Page transitions: staggered fade-up reveals with `animation-delay` increments of 60ms
- Card hover: subtle lift (`translateY(-2px)`) + shadow expansion + amber glow
- Button interactions: scale(0.97) on press, smooth color transitions (200ms ease)
- Sidebar nav items: slide-in indicator bar from left on active state
- Status transitions: smooth color morph with 300ms ease-in-out
- Loading states: skeleton shimmer with navy-to-light gradient sweep
- Use Angular's `@angular/animations` module for route transitions and component enter/leave

```css
/* Base transition */
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-spring: 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
```

## Backgrounds & Visual Details

- Dashboard background: subtle dot-grid pattern over `--surface-secondary`
- Sidebar: deep navy gradient from `--color-primary-900` to `--color-primary-800`
- Cards: frosted glass effect on hover (backdrop-filter: blur(8px))
- Section dividers: thin amber accent lines or gradient fades
- Resume viewer panel: dark inset background (`--color-neutral-800`) for contrast
- Screening/Call screens: split layout with details on left, action panel on right
- Noise texture overlay at 3-5% opacity on dark surfaces for depth
- Status pipeline visualization: horizontal stepper with connected dots and amber active indicator

## Component Patterns

### Buttons
- Primary: solid `--color-accent-blue-500` background, white text, bold weight
- Secondary: outlined with `--color-primary-500` border, transparent background
- Danger (Reject): solid `--color-danger-600` background, white text
- Success (Accept): solid `--color-success` background, white text
- Disabled: `--color-disabled` background, reduced opacity
- All buttons: 8px border-radius, 12px 24px padding, medium weight text

### Cards
- White background, 12px border-radius
- 3px left border in `--color-accent-blue-500` for active/highlighted cards
- Hover: lift + shadow-lg + subtle blue glow

### Tables
- Striped rows with alternating `--surface-primary` and `--color-neutral-100`
- Header row: `--color-primary-800` background, white text, medium weight
- Row hover: light blue tint (`--color-bg-blue-lightest`)
- Sticky header on scroll

### Forms
- Input fields: 8px border-radius, 1px `--color-neutral-500` border
- Focus state: 2px `--color-accent-blue-500` border with `--shadow-glow-accent`
- Labels: `--font-body` semibold, `--color-primary-600`
- Error states: `--color-danger-600` border + `--color-bg-red-light` background
- Disabled state: `--color-disabled` border and background

### Status Badges
```
PENDING         → --color-warning-600 bg, white text
APPROVED        → --color-success bg, white text
REJECTED        → --color-danger-600 bg, white text
IN_PROGRESS     → --color-accent-blue-500 bg, white text
COMPLETED       → --color-teal-200 bg, dark text
CANCELLED       → --color-neutral-600 bg, white text
```

## Layout Structure

```
┌─────────────────────────────────────────────────┐
│  Top Bar (logo, user avatar, notifications)     │
├──────────┬──────────────────────────────────────┤
│          │                                      │
│  Sidebar │  Main Content Area                   │
│  (dark   │  ┌──────────────────────────────┐   │
│   navy)  │  │  Page Header + Breadcrumbs   │   │
│          │  ├──────────────────────────────┤   │
│  • List  │  │                              │   │
│  • Screen│  │  Content (tables, forms,     │   │
│  • Call  │  │  split views, cards)         │   │
│  • Verify│  │                              │   │
│          │  └──────────────────────────────┘   │
│          │                                      │
└──────────┴──────────────────────────────────────┘
```

## Do NOT Use
- Generic fonts: Arial, Inter, Roboto, system-ui
- Purple gradients on white backgrounds
- Cookie-cutter Material Design defaults without customization
- Flat, lifeless layouts with no depth or texture
- Evenly distributed color palettes — commit to navy dominance with amber accents
