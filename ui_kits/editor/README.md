# Editor — UI Kit

A pixel-faithful, click-through recreation of the **Handpan Editor** main view, built from the source `_source/editor.html`. Component files are small, mainly-cosmetic JSX recreations — you can lift them straight into prototypes.

## What's in here

```
ui_kits/editor/
├─ README.md           ← this file
├─ index.html          ← interactive demo; load this to see the kit live
├─ app.jsx             ← root App component + state
├─ Toolbar.jsx         ← top bar with wordmark + mode toggles
├─ Sidebar.jsx         ← left sidebar with all panel sections
├─ PanCanvas.jsx       ← the white canvas + SVG handpan + note bubbles
├─ ProgressionsPanel.jsx  ← right panel: moods, roots, progression cards
├─ ChordsPanel.jsx     ← right panel: chord-type pills, chord cards
├─ RhythmPanel.jsx     ← bottom panel: HAT browser + 2-row R/L grid + transport
├─ primitives.jsx      ← Button, Pill, Badge, Legend, NoteLegend, etc.
└─ data.js             ← templates, chord types, moods, progressions, palette
```

## How to view

Open `index.html` directly in the project preview. You should see the full editor view with:

- **Toolbar** working — `♩ Rhythm`, `♬ Progressions`, `♩ Chords` toggle their respective side/bottom panels.
- **Sidebar** working — change the template dropdown to swap pan layouts, drag the radius slider to resize the pan body, click a note to select it.
- **Canvas** working — click any note to select it; it gets an orange resize handle.
- **Progressions panel** working — click a mood pill to filter, click a root to pin a key.
- **Chords panel** working — pick a chord type pill to filter.
- **Rhythm panel** working — pattern list filters by category and search; click a pattern to load it.

This is a *visual* recreation, not the real audio/export engine. Buttons that would trigger downloads or play audio just show a toast.

## Fidelity notes

- Colour, type, spacing, borders, hover/active states are copied verbatim from the source CSS.
- The pan-rendering geometry (concentric circles, note bubble layout) is taken from the `TEMPLATES` array in the source.
- Chord, progression and rhythm data is a representative subset of the source's `CHORD_TYPES`, `PROGRESSIONS`, and `HAT_PATTERNS`.
- Drag-to-move, drag-to-box-select, and audio playback are out of scope.

## Source of truth

If you spot a visual drift, cross-check against `_source/editor.html` — that's the canonical source. The CSS tokens live in `colors_and_type.css` at the project root.
