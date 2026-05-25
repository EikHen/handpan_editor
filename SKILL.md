---
name: handpan-editor-design
description: Use this skill to generate well-branded interfaces and assets for the Handpan Editor (handpan_editor by EikHen) — a browser-based exploration editor for handpan layouts, chords, progressions and rhythms. Contains essential design guidelines, colours, type, fonts, assets, and a UI-kit recreation of the editor's main view for production work or throwaway prototypes.
user-invocable: true
---

Read the `README.md` file within this skill — it has the full product context, content fundamentals, visual foundations and iconography rules. Browse the other files as you need them:

- `colors_and_type.css` — every CSS variable (colours, type, spacing, radii, shadows) plus semantic `.t-*` classes. Import or copy from here; don't invent new tokens.
- `assets/` — wordmark SVG, handpan icon mark, favicon.
- `preview/` — design-system review cards (typography, colour, spacing, components, brand). Use these as visual references when deciding how a new surface should feel.
- `ui_kits/editor/` — a pixel-faithful click-through recreation of the main editor view, factored into small JSX components. Lift components from here for prototypes that need to look like the real editor.
- `_source/editor.html` — the original product source code. Read this when you need the canonical answer to "what does this look like" or "what data does the product use" (chord types, mood lists, progression library, rhythm patterns, pitch-class palette, etc).

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick reminders

- **The product is dark studio chrome around a white paper canvas.** Don't make the chrome lighter; don't make the canvas darker.
- **Two semantic colour pairs.** Steel-blue accent for everything generic; right-hand-blue / left-hand-amber for rhythm notation.
- **Type is tight.** 9–15 px Arial covers everything. Courier New for grids and roman numerals.
- **No emoji, no gradients, no purple-blue marketing flourishes.** The visual vocabulary is Unicode music glyphs and geometric status dots.
- **Borders define regions, not fills.** Almost every interactive element has a 1 px coloured border.
- **Hover is a 120 ms colour cross-fade. Never a transform, scale, or fade-in.**
