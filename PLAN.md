# Architectural Implementation Plan: Frosted Glass CS Portfolio

## 1. Project Context & Objectives
- **Source Project:** Stitch "Frosted Glass CS Portfolio" (`projects/4080057425519345399`)
- **Analyzed Screens:**
  1. `CS Student Portfolio - Desktop` (`c9e6e3b4cfec417183678fd0d9d28feb`)
  2. `CS Student Portfolio - Mobile` (`3a4dfe207d9f4c1d91523ac5f4e4b9ab`)
  3. `Resume Print Template` (`b36808e9f1aa477c962e3b83ce1b704f`)
- **Philosophy (@ponytail):** Zero unnecessary frameworks or heavy npm dependencies. Pure semantic HTML5, vanilla CSS custom properties for frosted glassmorphism, responsive CSS Grid / Flexbox, and native browser `@media print` rules.

---

## 2. Design System Tokens (Extracted & Compressed)

### Typography
- **Headings & Display:** `'Space Grotesk', sans-serif`
- **Body & Copy:** `'Inter', sans-serif`
- **Technical & Labels:** `'Helvetica Neue', sans-serif`

### Color Palette & Ambient Mesh
- **Base Canvas (`--color-bg`):** `#101319` (Zinc-twilight deep obsidian)
- **Primary Accent (`--color-primary`):** `#06b6d4` / `#4cd7f6` (Electric Cyan)
- **Secondary Accent (`--color-secondary`):** `#8b5cf6` / `#d0bcff` (Nebula Violet)
- **Status / Tertiary (`--color-tertiary`):** `#10b981` / `#4edea3` (Emerald Pulse)
- **Text Primary (`--color-text-primary`):** `#f1f5f9`
- **Text Secondary (`--color-text-secondary`):** `#94a3b8`
- **Text Muted (`--color-text-muted`):** `#64748b`

### Frosted Glass Surfaces (`backdrop-filter`)
- **Surface Subtle:** `rgba(24, 28, 36, 0.45)`, `backdrop-filter: blur(12px)`
- **Surface Default:** `rgba(30, 34, 43, 0.60)`, `backdrop-filter: blur(16px)`
- **Surface Raised (Hover):** `rgba(38, 44, 56, 0.75)`, `backdrop-filter: blur(20px)`
- **Glass Borders:**
  - Default: `1px solid rgba(255, 255, 255, 0.08)`
  - Highlight / Hover: `1px solid rgba(255, 255, 255, 0.16)`
  - Active Glow: `1px solid rgba(6, 182, 212, 0.40)`
- **Ambient Shadow:** `0 8px 32px -4px rgba(0, 0, 0, 0.35)`

---

## 3. Architecture & File Layout

```
Portfolio_2/
├── index.html              # Main web portfolio shell
├── resume.html             # A4/Letter CV template (standalone view + print layout)
├── css/
│   ├── tokens.css          # Design system variables (colors, typography, glass, spacing)
│   ├── style.css           # Layout grids, components, responsive breakpoints
│   └── print.css           # Clean A4 print rules (@media print) without overlays/blur
└── assets/
    └── avatar-placeholder.svg # Minimalist vector avatar placeholder
```

---

## 4. Module Decomposition & Implementation Scope

### Module 1: Foundation & CSS Tokens (`tokens.css`, `style.css`)
- Define semantic CSS custom properties for dark mode glassmorphism.
- Set up responsive baseline grid (12-col desktop `max-width: 1280px`, 8-col tablet, 4-col mobile).
- Ambient background layer: subtle radial gradient halos (cyan + violet at 5-8% opacity) fixed in background.

### Module 2: Hero Section Component
- **Avatar Container:** Circular glass ring with ambient cyan back-glow and pulsating emerald "Available for Roles" status pill.
- **Identity & Bio:** Heading (`Space Grotesk`), subline status pills ("Stanford '26", "Systems Architecture"), and bio paragraphs (`Inter`).
- **Frosted Glass Social Placeholders:** Monospace badges / icon slots for GitHub, LinkedIn, X, and Email.
- **Action Group:**
  - Primary button: `mailto:` email action with Electric Cyan edge glow.
  - Secondary button: 'Download Resume' (links directly to `resume.html`).

### Module 3: Interactive Canvas ("Interactive Game Area")
- Standalone frosted glass card container (`min-height: 420px`).
- Header bar: Telemetry status badge (`CANVAS READY // 60 FPS`, Helvetica Neue), controls placeholder.
- Interior viewport: Geometric crosshair corners, centered ready slot badge, waiting for future game/WebGL engine integration.

### Module 4: Grid & Feeds Section
- **GitHub Repositories Grid:**
  - 2-column responsive layout (1-column on mobile).
  - Glass card anatomy: Repository title, language pill, synopsis, syntax-preview glass drawer, star/fork telemetry counters.
- **LinkedIn Highlights Feed:**
  - Horizontal/vertical feed cards summarizing professional announcements, publications, and internship updates with engagement metrics.
- **Academic Journey (Education Timeline):**
  - Continuous vertical hairline axis (`rgba(255, 255, 255, 0.1)`) with emerald milestone nodes.
  - Coursework chips (`Helvetica Neue`) and honors badges.

### Module 5: Resume Print Template (`resume.html` + `print.css`)
- **Screen View:** Centered A4 desk layout on dark canvas with "Print / Save PDF" top utility bar.
- **Print View (`@media print`):**
  - Standard A4 sheet (`210mm x 297mm`, margin: 12mm).
  - Background blurs disabled for pure high-contrast printer output.
  - Pure vector/text contrast (`#000` text on `#fff` or high-fidelity dark monochrome option).
  - Structural sections: Header & Contact strip, Executive Summary, Experience, Education, Technical Skills, Systems Projects.

---

## 5. Execution Waves & Task Breakdown

### Wave 1: Design Tokens & Base Styles
- **Task 1.1:** Create `css/tokens.css` with exact Stitch color palette, frosted glass properties, and typography.
- **Task 1.2:** Create `css/style.css` with reset, container grid, ambient gradient backdrop, and button/badge utilities.

### Wave 2: Main Portfolio Shell (`index.html`)
- **Task 2.1:** Implement Hero Section (Avatar, bio, social badges, mailto & resume CTAs).
- **Task 2.2:** Implement Interactive Canvas placeholder container.
- **Task 2.3:** Implement Grid & Feeds (GitHub cards, LinkedIn feed, Education timeline) with responsive layout.

### Wave 3: Resume Print Template (`resume.html` + `print.css`)
- **Task 3.1:** Build `resume.html` structural layout matching Stitch resume screen.
- **Task 3.2:** Configure `css/print.css` with `@page` sizing, print media query resets, and browser PDF compatibility.

---

## 6. Verification Criteria
1. **Zero External Dependencies:** No external JS bundles, node_modules, or heavy styling frameworks.
2. **Design Fidelity:** Frosted glass effect (`backdrop-filter: blur(...)`) visually matches the Stitch Desktop and Mobile screens.
3. **Responsive Breakpoints:** Smooth reflow across Mobile (<768px), Tablet (768px-1024px), and Desktop (>1024px).
4. **Print Compatibility:** Pressing `Ctrl/Cmd + P` on `resume.html` produces a clean, unclipped single/double-page A4 PDF without UI navigation artifacts.
