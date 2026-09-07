# RULES_DESIGN.md

## Purpose
Rules for visual design, layout, UX, and UI consistency.

## Visual Character
- Modern.
- Mature.
- Friendly.
- Not childish.
- Not decorative for its own sake.

## Theme
- Support light and dark mode.
- Use design tokens and CSS variables.
- Do not hardcode colors in components.
- Keep contrast readable in both themes.

## Layout
- Use sidebar-oriented navigation when appropriate.
- Keep content density comfortable for adult operational work.
- Prefer stable layouts over flashy movement.
- Use clear hierarchy and consistent spacing.

## UI States
Every meaningful view must support:
- Loading.
- Empty.
- Error.
- Success.

Loading should use skeletons or structural placeholders, not random spinners.
Empty states should explain what is missing and what to do next.
Error states should be readable and recoverable.

## Typography
- Use system-friendly readable fonts.
- Support Vietnamese diacritics cleanly.
- Avoid cartoon, playful, or decorative typefaces.

## Components
- Prefer shadcn/ui and Radix primitives.
- Reuse patterns for tables, dialogs, forms, filters, and status chips.
- Keep interaction patterns consistent across modules.

## Motion
- Use subtle motion only.
- Respect reduced-motion preferences.
- Do not use animation as decoration.

## Accessibility
- Semantic HTML first.
- Keyboard accessible by default.
- Visible focus states.
- Labels and helper text must be clear.
- Do not trade accessibility for visual style.

## i18n
- All visible text must be ready for translation.
- Primary locale is vi-VN.
- Date and currency formatting must be locale-aware.
