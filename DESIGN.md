# Design Truth: KinderManagement

## Visual Direction
- **Style:** Premium, modern, clean (Soft Minimalism with Glassmorphism accents).
- **Vibe:** Calm, professional, and accessible.
- **Audience Feel:** High-end educational software.

## Dials
- **DESIGN_VARIANCE:** 6 (Balanced but modern, asymmetrical where it makes sense).
- **MOTION_INTENSITY:** 7 (Fluid, spring-based micro-interactions, smooth page transitions).
- **VISUAL_DENSITY:** 5 (Spacious, breathable, avoiding cramped dashboards).

## Typography
- **Primary Font:** Plus Jakarta Sans or Outfit (Premium look, highly legible).
- **Secondary/Body Font:** Same as primary or Inter (if absolutely necessary for data density, but prefer primary).
- **Strict Rule:** Avoid default system fonts or overused generic fonts (Arial).

## Color Palette
- **Primary:** Vibrant, modern colors (e.g., tailored Blue or Emerald).
- **Grays:** NO pure black (`#000000`) or pure gray. All grays MUST be tinted with the primary brand color (e.g., slate, zinc, or custom tinted grays).
- **Text on Backgrounds:** Ensure high contrast. NEVER use gray text on colored backgrounds.

## Layout & Components
- **Strict Rule:** Avoid excessive nesting of cards (cards inside cards). Use whitespace, subtle dividers, or background color shifts to define hierarchy instead of borders.
- **Shadows:** Soft, diffused shadows for elevation.
- **Corners:** Rounded (`xl` or `2xl`) for a friendly but modern look.

## Motion Guidelines (Anti-slop)
- Avoid "bounce" easing.
- Use smooth spring physics (Framer Motion) or GSAP for natural, high-quality motion.
