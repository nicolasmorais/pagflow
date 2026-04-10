# Design System: PagFlow (Premium Edition)

## 1. Visual Theme & Atmosphere
PagFlow follows a **"Premium Dashboard"** aesthetic that balances high-density utility with "Gallery-Airy" elegance. The atmosphere is professional, secure, and modern, utilizing a deep off-black base for structural elements (like the sidebar) contrasted with a clean, functional canvas for data. The design leverages **Glassmorphism**, subtle **Glowing Accents**, and high-fidelity typography to communicate trust and speed.

- **Density:** 6/10 (Balanced for administrative speed)
- **Variance:** 4/10 (Structured yet dynamic with asymmetric gradients)
- **Motion:** 6/10 (Fluid spring-physics, micro-interactions on hover)

## 2. Color Palette & Roles
The system uses a sophisticated "Dark-Core" palette with a singular vibrant green accent.

### Core Surfaces
- **Deep Obsidian** (`#0d1117`) — Primary sidebar and navigation surface.
- **Canvas Neutra** (`#F5F3EE`) — Application background for a tactile, paper-like feel.
- **Pure Surface** (`#FFFFFF`) — Card and container fill for high-contrast data display.

### Accents & Interactions
- **Vibrant Growth** (`#1A8C4E`) — Primary action color, active states, and success indicators.
- **Whisper Border** (`rgba(255, 255, 255, 0.07)`) — Structural lines on dark surfaces.
- **Mist Border** (`#E8E4DB`) — Structural lines on light surfaces.

### Typography Colors
- **Coal Ink** (`#1A1A18`) — Primary headlines and body on light surfaces.
- **Silver Cloud** (`rgba(255, 255, 255, 0.88)`) — Primary text on dark surfaces.
- **Muted Smoke** (`#5C5C59`) — Secondary metadata and instructions.

## 3. Typography Architecture
Strict hierarchy using weights over massive scale shifts.

- **Primary Stack:** `Space Grotesk` (Sans-Serif)
- **Headlines:** `Space Grotesk` — Weight: 700-900. Track-tight (-0.03em). Letter-spacing: -0.03em.
- **Body:** `Space Grotesk` / System Sans — Weight: 500-600 for readability. Relaxed leading (1.5).
- **Metadata/Labels:** `Space Grotesk` — Weight: 700. Uppercase. Letter-spacing: 0.12em. Size: 10px-11px.
- **Banned:** `Inter`, `Times New Roman`, and generic AI script fonts. No neon gradients on text.

## 4. Component Stylings
- **Cards:** Rounded (`18px`). Border: `1px solid #E8E4DB`. Box-shadow: `0 1px 3px rgba(0,0,0,0.04)`.
- **KPI Cards:** Feature subtle background glows (`radial-gradient`) matching the metric type (e.g., green for revenue).
- **Sidebar Items:** Pill-shaped (`13px`). Active state uses `linear-gradient(135deg, #22a85f, #1a8c4e)` with shadow.
- **Buttons:** Tactile feedback on press (-1px Y-translate). Arched corners.
- **Form Inputs:** Arched corners (`12px`). Border: `1px solid #e2e8f0`. Focus state: `1px solid #6366f1`.

## 5. Layout & Responsive Principles
- **Grid Strategy:** CSS Grid preferred. Maintain strict alignment to the sidebar rhythm.
- **Containment:** Main content area max-width `1400px` centered.
- **Mobile-First:** Single-column collapse below `768px`.
- **Navigation:** Fixed sidebar on desktop; becomes a hidden drawer or bottom nav on mobile to maximize viewport.

## 6. Motion & Micro-interactions
- **Spring Physics:** `stiffness: 120, damping: 20` for a weighty, premium feel.
- **Hover States:** Glassy lifts, subtle brightness shifts, and scale resets (1.02x).
- **Waterfall Reveals:** Dashboard sections should animate in with a staggered `100ms` delay.

## 7. Anti-Patterns (BANNED)
- **NO** emojis in the administrative interface.
- **NO** pure black (`#000000`) for surfaces; use Obsidian (`#0d1117`).
- **NO** neon "Cyberpunk" glows. Shadows must be hue-tinted or neutral.
- **NO** `Inter` font for branding or headings.
- **NO** generic AI filler copy ("Unlock your potential", "Harness the power").
- **NO** fake data metrics (uptime, SLA) unless explicitly provided by the system.
