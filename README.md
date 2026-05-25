# Handpan Editor — Design System

A design system for the **Handpan Editor** (also known as the *Handpan Scale Generator v2*) — a browser-based, single-file HTML application for designing handpan layouts and exploring the notes, chords, progressions and rhythms playable on them.

> **Mission.** An easily accessible, in-browser exploration editor for handpans — welcoming, simplistic, intuitive.

---

## Source

This design system is derived from a single source: a self-contained `editor.html` file (~260 KB) that ships the entire app.

- **GitHub:** [`EikHen/handpan_editor`](https://github.com/EikHen/handpan_editor) — explore the repo for context on how the editor is built; the design system here is a structured re-presentation of its tokens, components and visual rules.
- License: GNU AGPL-3.0

A copy of the source is preserved at `_source/editor.html` for reference; do not edit it.

---

## The product, in one screen

The editor lives at a single URL and centres on a **white "paper" canvas** showing the handpan as concentric circles with labelled note bubbles. Everything else is dark, panel-style chrome that wraps the paper:

```
 ┌─────────────────────────────── Toolbar ────────────────────────────────┐
 │ ♩ Handpan Editor   │ ♩ Rhythmβ   ♬ Progressions   ♩ Chords           │
 ├──────────────┬────────────────────────────────────┬────────────────────┤
 │              │                                    │                    │
 │  SIDEBAR     │            CANVAS                  │  PROGRESSIONS /    │
 │  (252 px)    │       (white paper, dark matte)    │  CHORDS PANEL      │
 │              │                                    │  (340 / 320 px)    │
 │  Template    │            (the pan)               │                    │
 │  Pan Edit    │       ┌──────┐                     │  Mood pills        │
 │  Note        │      │  D3  │  ← labelled bubble   │  Root note bar     │
 │  Highlight   │       └──────┘                     │  Progression cards │
 │  Audio       │                                    │                    │
 │  Shortcuts   │                                    │  Export → ZIP      │
 ├──────────────┴────────────────────────────────────┴────────────────────┤
 │                       RHYTHM PANEL (bottom, ~300 px)                   │
 │  ┌───── browser ─────┐  Edit toolbar                                   │
 │  │ category pills    │  R: || D | • | T | • | D | • | T | • ||         │
 │  │ pattern cards     │  L: || • | T | • | T | • | T | • | T ||         │
 │  └───────────────────┘  ♩ = 90  [Tap]  [▶ Play]  [⤢]  [✕]            │
 └────────────────────────────────────────────────────────────────────────┘
```

### Three pillars

The editor's product copy and toolbar group everything into three pillars:

1. **Layout editor.** Move, resize, label and colour note bubbles on a circular pan body. Multi-select, drag-box, nudge with arrows, undo/redo, import/export JSON, export SVG/PNG.
2. **Notes, Chords & Progressions.** Filter chord progressions by **mood** (Happy, Melancholic, Jazz, Epic, Dark, Peaceful) and **root note**; instantly see which chords/progressions are *playable* on the user's current pan with a coverage status (`● Complete` / `◕ −1 note` / `◔ −2+` / `○ None`). Bulk-export selected chords or progressions as a ZIP of SVGs.
3. **Rhythm & tablature.** A "HAT" (Handpan ASCII Tab) browser, editor and player — pick from genres (Arabic, Persian, Greek, Flamenco, Indian, West-African, Brazilian, Drum Set, Odd Metre, Polyrhythm…), edit on a 2-row R/L grid, set BPM, tap-tempo and play back.

---

## Index of this design system

| File / folder           | What's inside |
| ----------------------- | ------------- |
| `README.md`             | This file — product context, content fundamentals, visual foundations, iconography |
| `SKILL.md`              | Cross-compatible Agent Skill entry-point (runs in Claude Code if dropped in as a skill) |
| `colors_and_type.css`   | Every CSS variable — colours, type, spacing, radii, shadows — plus semantic `.t-*` classes |
| `_source/editor.html`   | Original source from `EikHen/handpan_editor`, read-only reference |
| `assets/`               | Wordmark, handpan icon mark, favicon SVGs |
| `preview/`              | 23 design-system review cards (type, colour, spacing, components, brand) |
| `ui_kits/editor/`       | UI kit for the editor product: `index.html` (interactive recreation), `kit.css`, plus `Toolbar.jsx`, `Sidebar.jsx`, `PanCanvas.jsx`, `ProgressionsPanel.jsx`, `ChordsPanel.jsx`, `RhythmPanel.jsx`, `primitives.jsx`, `app.jsx`, `data.js`. See `ui_kits/editor/README.md` for full details. |

---

## CONTENT FUNDAMENTALS

The editor's copy is the copy of an **instrument**, not a marketing site. It is tight, technical, and deferent to musical convention.

### Tone

- **Voice:** terse, lower-case where possible, musician-to-musician. Never explains what a "Dom7" is — it expects you to know. When it does explain, it uses the *minimum* number of words ("Pick a pattern from the sidebar to start editing, or create a new one.").
- **No "we", almost no "you".** Most strings are imperative or label-only: "Add", "Dup", "Delete", "Select a note to edit." When "you" appears, it's instructional and brief.
- **Music theory is taken seriously.** The roman-numeral analysis (`ii–V–I`, `I IV V`) and chord symbols (`△`, `−`, `°`, `+`, `sus²`, `ø⁷`, `−△⁷`) are used as-is, with proper Unicode glyphs — never `Maj7` where `△⁷` will do. Pitch class names use real flats and sharps (`B♭`, `F♯`), not `Bb` / `F#`, in display strings. (`Bb` / `F#` is accepted as user *input* for ergonomics.)

### Casing

- **UPPERCASE, letter-spaced** for panel headings and section dividers. e.g. `PAN EDITING`, `LAYOUT FILE`, `NOTES`, `HISTORY`, `MOOD`, `ROOT NOTE`.
- **Sentence case** for buttons, hints, modal labels, tooltips. e.g. "Export layout as JSON", "Select a note to edit.", "Search rhythms…".
- **Title Case** for proper nouns: template names ("D3 Kurd 18", "F#2 Nordlys 15"), mood labels ("Happy", "Melancholic"), pattern categories ("Arabic/Turkish", "Forró").
- **lowercase** for soft hints under controls. e.g. "ghost" (next to a volume slider), "— choose a template —" (placeholder).

### Examples to imitate

| Surface       | Copy                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------ |
| Panel title   | `PAN EDITING` · `HIGHLIGHT` · `AUDIO` · `SHORTCUTS`                                        |
| Sub-label     | `Layout file` · `Notes` · `History` · `Enharmonics` · `Pan body`                           |
| Empty state   | `Select a note to edit.`                                                                   |
| Button label  | `+ Add` · `⧉ Dup` · `✕ Delete` · `↩ Undo` · `↪ Redo` · `⬇ SVG` · `⬇ PNG`               |
| Tooltip       | `Export current view as SVG` · `Notation legend` · `Expand to full window`                 |
| Helper hint   | `Alt+Click notes, chords or tiles to hear them`                                            |
| Welcome blurb | `Pick a pattern from the sidebar to start editing, or create a new one.`                   |
| Placeholders  | `D3, Bb4, F#5 …` · `Search rhythms…` · `D4 E4 F#4 A4 B4 …` · `My Pattern`                  |
| Status legend | `● Complete   ◕ −1 note   ◔ −2+   ○ None`                                                  |
| Beta tag      | renders as a tiny orange superscript `β` after a button label                              |
| Roman numerals| `I IV V` · `ii–V–I` (with proper en-dashes)                                                |

### What to avoid

- **No emoji.** The product communicates with Unicode music glyphs (`♩`, `♬`, `♪`, `△`, `°`, `⤢`) and geometric shapes (`●◕◔○ ■ ◆ ◌ ⚡ ☀`). Avoid 😀-style emoji entirely.
- **No marketing copy.** No headlines like "Design your dream pan." No CTAs like "Get started in seconds."
- **No "Welcome to…" preamble.** When the editor opens, it just *is* the editor.
- **Don't pad with periods.** Short labels and tooltips never end with a period. Full sentences in helper text do.
- **Never lose the diacritical.** "Forró" keeps the acute. "Maqsoum (§8A)" keeps the section sign.

### Vibe in one line

> The friendly, no-fuss, music-theory-literate cockpit of a musician who already knows what they're doing.

---

## VISUAL FOUNDATIONS

### Vibe

A **warm-light studio panel wrapped around a white sheet of paper.** Cream surfaces, soft taupe borders, a sandstone matte that frames the canvas. Calm, inviting, easy on the eyes — the opposite of a cold "DAW chrome" feel. The instrument lives in a sunlit workshop, not a server room.

### Colour

A small, deliberate palette. Full token list lives in `colors_and_type.css`.

**Surfaces (cream side).** Five steps from the app body up to white cards:

- `--surface-app` `#f5efe3` — app body, warm cream
- `--surface-panel` `#fbf7ee` — toolbar, sidebars, panels (lightest cream)
- `--surface-panel-2` `#f0e8d8` — transport / footer (slight tan)
- `--surface-card-hover` `#fdf9f0` — card hover
- `--surface-card` `#ffffff` — white card on the cream
- `--surface-input` `#fbf7ee` — inputs (same as panel — they sit *with* the surface, framed by border)
- `--surface-canvas-bg` `#e8ddc6` — sandstone matte around the paper

**Canvas (paper side).**

- `--surface-paper` `#ffffff` — the printable canvas
- `--surface-paper-fill` `#f2f2f2` — the pan body
- `--border-paper` `#c0c0c0` (5 px) — pan outer ring
- `--border-paper-soft` `#e0e0e0` (1.5 px) — concentric inner ring

**Borders.** Warm taupe. `--border-divider` `#ddd2bd` on panel splits; `--border-input` `#c9bda6` on every control.

**Cool accent.** A deep steel blue: `--accent` `#3d7395`, deeper to `--accent-hover` `#2c5e7a` and `--accent-bright` `#1f4a63`. Active states use a very light `--accent-fill` `#e3eaf2` plate with the dark accent text on top. The wordmark "Handpan Editor" uses `--accent-title` `#2c5e7a`.

**Warm accent.** New in this iteration. A deep copper-amber `--accent-warm` `#b8763a` for welcoming surfaces, onboarding moments, the beta superscript. Paired with `--accent-warm-fill` `#f5e8d5` for soft active plates.

**Hand colours.** The semantic R/L dyad — **right hand is cool steel-blue**, **left hand is warm copper**.

| Hand | Fill | Border | Hit fg | Muted fg | Ghost fg |
| ---- | ---- | ------ | ------ | -------- | -------- |
| **R** | `#e3eaf2` | `#b8c9d6` | `#2c5e7a` | `#7a98ad` | `#b3c0cc` |
| **L** | `#f5e8d5` | `#d4b896` | `#8e5828` | `#b8956b` | `#d4be9c` |

**Harmonic function colours.** Chord-tile top-borders carry a tiny semantic stripe:

- **Tonic** `#3d7395` (cool)
- **Subdominant** `#3a7a4a` (settled green)
- **Dominant** `#b8763a` (warm copper)

**Playability legend.** `● Complete #1a9966` · `◕ −1 note #c08a00` · `◔ −2+ #c63838` · `○ None #b0a89b`.

**Pitch class palette.** A rainbow of 12 carefully-distinct colours, one per semitone (C…B). **Tuned for the white canvas** (not the warm chrome). Used in the side legend and on note bubbles when "By note" highlight mode is active.

### Type

System stacks only. **Arial** for everything UI-side, **Courier New** for code blocks, tab grids and roman-numeral chord strips.

> ⚠ **Substitution flag.** No webfonts ship. If you want a more characterful body face, swap to **DM Sans** (token: `--font-alt`). It's the closest humanist sans that keeps the editor's clinical proportions.

Scale is **tight**: 9–15 px covers all UI text. Canvas-drawn SVG labels go larger (14–22 px on note bubbles, 30 px for the chord caption).

Text colour follows a 7-step ramp from `--fg-1` `#3a3027` (warm espresso primary) down to `--fg-whisper` `#c4b9a6` (almost invisible).

### Spacing

Tight, almost cramped. **3 / 5 / 8 / 12 px** stops:

- Panel padding: `11 12 px`
- Row gap: `3 px` between label and control, `8 px` between rows
- Button padding: `5 11 px` (default), `4 10 px` (pill), `3 9 px` (small)

Sidebar widths are **fixed**: sidebar 252 px, side panel 320 / 340 px, toolbar 48 px tall, rhythm panel 300 px tall by default.

### Backgrounds

**Flat, no gradients in the editor itself.** Every surface is a single solid cream tone. The review-pane preview cards use a subtle warm gradient on the body for a slight catalog feel, but the editor stays flat.

**No textures, no patterns, no illustrations.** The pan's concentric rings are the only decorative element, and they're functional.

### Borders, radii, shadows

- **Corner radii are small.** `4 px` buttons / inputs, `5 px` tiles, `6 px` cards, `12 px` pills, full circles for note bubbles.
- **Borders define regions.** Every button, pill, card, input has a 1 px warm-taupe border. Active states swap to the accent.
- **Shadows reserved for paper and pop-ups.** The canvas shadow (`0 4 px 24 px / .12`), popups (`0 2 px 12 px / .14`), modals (`0 8 px 30 px / .18`). Cards, buttons, pills get none.

### Hover, focus, press

A consistent **three-step lift** on every interactive element. Just colour, 120 ms, no transforms or scales.

| State       | Border             | Background         | Text                |
| ----------- | ------------------ | ------------------ | ------------------- |
| **default** | `--border-input`   | `--surface-card`   | `--fg-2`            |
| **hover**   | `--accent`         | `--accent-fill-hover` `#d4dfe9` | `--accent-bright`   |
| **active**  | `--accent` + `0 0 0 1 px --accent` | `--accent-fill` `#e3eaf2` | `--accent-bright`   |
| **danger-hover** | `--danger`    | `--danger-hover-bg` `#f7e3df`   | `--danger`         |

Focus on text inputs lights the border to `--accent`; nothing else changes.

### Transparency & blur

Almost none. Used only for the drag-box selection rectangle (`.12` accent fill).

### Animation

This product is **mostly static**. Hover cross-fades (`120 ms`); rhythm playhead column does a `brightness(0.93) saturate(1.4)` step. No bounces, no springs, no fade-ins. The UI snaps. This is intentional — it's a tool, not a toy.

### Layout rules

- The **canvas is always centred** in its scroll-area, with a soft drop-shadow.
- Sidebars are **fixed-width** and **scrollable** when content overflows.
- The **toolbar is 48 px tall**, full-width.
- The **rhythm panel docks to the bottom** with a `row-resize` handle.
- Modals use a dim backdrop and a centred white card, no animation.

---

## ICONOGRAPHY

The editor's icon language has **two layers**.

### Layer 1 — Unicode glyphs (for terse, inline labels)

Used inline next to text labels in the editor's source UI. Always paired with text.

- **Music symbols** — `♩` (rhythm, chords, melancholic), `♬` (progressions), `♪` (jazz)
- **Chord symbols** — `△ − ° + sus² sus⁴ △⁷ −⁷ ⁷ °⁷ ø⁷ −△⁷ ⁶ −⁶`
- **Arrows** — `⬇ ⬆ ↩ ↪ ▶ ◀ ▶ ▸ ▾`
- **Status glyphs** — `● ◕ ◔ ○` (playability), `■` (legend swatches), `⚠` (errors)
- **Mood glyphs** — `☀` Happy, `♩` Melancholic, `♪` Jazz, `⚡` Epic, `◆` Dark, `◌` Peaceful
- **R / L** — hand identifiers in rhythm grids

### Layer 2 — Tasteful geometric SVG set (new)

For larger / more decorative surfaces (onboarding, marketing, future product chrome), a **41-icon Lucide-style geometric set** ships in `assets/icons/`:

- **24×24 viewBox, 1.75 px stroke, round caps/joins, no fills.**
- **`stroke="currentColor"`** — the icon picks up whatever colour its container uses (accent blue by default; warm copper on welcoming surfaces; R/L hand colours in rhythm contexts).
- Available as **individual SVG files** (`assets/icons/<name>.svg`) and as a **sprite** with `<symbol>` defs (`assets/icons/_sprite.svg`).
- Full list in `assets/icons/index.json`.

#### How to use

**Inline `<svg>` + `<use>` from the sprite** (preferred — preserves `currentColor`):

```html
<svg width="20" height="20"><use href="/assets/icons/_sprite.svg#i-play"/></svg>
```

**`<img src>`** works too, but the icon will render in its default (black) stroke unless the SVG sets a fixed colour:

```html
<img src="/assets/icons/play.svg" width="20" height="20">
```

**CSS mask** is the cleanest way to recolour an `<img>`-style icon via CSS:

```css
.icon-play {
  width: 20px; height: 20px;
  background: currentColor;
  mask: url(/assets/icons/play.svg) center / contain no-repeat;
}
```

#### When to use which layer

- **Inline tight UI** (buttons in the toolbar, pills in panels, single-glyph status) → Unicode. Smaller, no asset to load, perfect alignment with text.
- **Larger or decorative surfaces** (onboarding cards, marketing pages, feature illustrations, side-nav with icon+label) → SVG set. Stroke weight matches text more elegantly at larger sizes.
- **Mood pills** still use Unicode (`☀ ♩ ♪ ⚡ ◆ ◌`) for tightness, but the SVG `sun / moon / zap / diamond / circle-dashed` variants are available if a bigger surface needs them.

### What's not used

- **No emoji.** The product communicates with Unicode and our geometric SVGs, never 🎵 / 🎶 / 🥁.
- **No raster icons.** No PNG icons in the repo.
- **No third-party icon library** is loaded at runtime — the SVG set is hand-drawn (Lucide-aligned in style only).

### Logo

The editor has no graphic logo — just the **wordmark** "♩ Handpan Editor" rendered in `bold 15 px Arial` at `--accent-title` `#2c5e7a`. A small **handpan mark** (concentric pan + 9 pitch-coloured dots) lives at `assets/handpan-mark.svg` for favicons, app icons, and any place the wordmark would be too wide. A simplified favicon SVG is at `assets/favicon.svg`.

---
