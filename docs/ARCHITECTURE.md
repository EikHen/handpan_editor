# Architecture

## Module load order

The application consists of 11 vanilla JavaScript modules that must be loaded in a specific order to ensure all dependencies are available:

1. **constants.js** — No deps; pure data: pitch colors, chord types, progressions, palette, default layout
2. **templates.js** — Async template loader; fetches JSON from templates/ via manifest
3. **theory.js** — Uses constants; music theory helpers: pitch parsing, MIDI, enharmonics
4. **state.js** — No deps; global mutable state and localStorage key constants
5. **audio.js** — Uses state, theory; Web Audio playback and settings persistence
6. **render.js** — Uses state, theory, constants; SVG rendering, undo/redo, note CRUD
7. **interaction.js** — Uses state, render, theory; mouse/touch events, drag, selection, editing
8. **export.js** — Uses state, theory, constants, render; SVG/PNG/JSON/ZIP export, import, toasts
9. **explore.js** — Uses state, constants, theory, audio, render; chord/progression explorer
10. **hat-bridge.js** — Uses state, theory, audio; HAT rhythm editor iframe bridge
11. **ui.js** — Wires everything; keyboard shortcuts, sidebar, resize handles, init IIFE

**Load order is critical.** All functions are global; inline onclick handlers in HTML depend on this sequence.

## Key constraints

- **No build tooling** — Pure vanilla JS with `<script src>` tags in order
- **No ES modules** — All functions added to global scope
- **No frameworks** — DOM mutations via `svgEl()` helpers and direct manipulation
- **HTTP-only templates.js** — Requires server; file:// protocol fails on CORS
- **Inline event handlers** — onclick= works because functions are global by load time

## Data flow

```
User action (click, drag, key)
  ↓
interaction.js / ui.js event handlers
  ↓
Mutate state.js (pan, notes, selections, highlights)
  ↓
render() → SVG DOM tree updates
  ↓
pushHistory() → undo/redo stack + localStorage save
  ↓
_syncHatNotes() → postMessage to HAT iframe (if rhythm mode)
```

## Key modules

### constants.js
Pure data: `PC_COLORS`, `CHORD_TYPES`, `PROGRESSIONS`, `PALETTE`, `DEFAULT_STATE`, `TEMPLATES`

### state.js
Mutable globals:
- `state` — pan (cx, cy, r, name) + notes array + nextId
- `selectedIds` — Set of currently selected note IDs
- `history`, `histIdx` — undo/redo stack
- `hlMode`, `hlChordType`, `hlChordRoot` — chord highlight state
- `appMode` — 'edit' | 'explore' | 'rhythm'

### render.js
Core rendering loop: `render()` clears SVG and redraws pan + notes, with selection/highlight styling.

Undo/redo: `pushHistory()` saves snapshots to history array; `undo()`/`redo()` restore.

Note CRUD: `addNote()`, `deleteSelected()`, `duplicateSelected()`, `selectAll()`.

### export.js
- `buildSVGString()` — Generate SVG as string (with collision-avoidant chord label Y position)
- `exportJSON()`, `exportCurrentSVG()`, `exportCurrentPNG()` — File downloads
- `exportAllChordsZip()` — Generate all 12×types chords as PNG + ZIP
- `showToast()` — Transient notifications with error styling
- JSON import handler — File input listener with separate parse/mutation error handling

### explore.js
Chord/progression explore panel: filter by mood, root, type; visualize playability; custom progression builder.

### hat-bridge.js
postMessage bridge to embedded HAT (Hand Auditioning Tool) rhythm editor iframe. Syncs note list and theme variables.

## Error handling

- `audio.js`: Try-catch on `ensureAudioCtx()`, warns on `playNote()` failure
- `export.js`:
  - `exportCurrentPNG()`: .catch() handler with error toast
  - `exportAllChordsZip()`: try-catch wrapper around async body
  - JSON import: Split into two try-catch (parse vs. mutation)
- `editor.css`: `.toast.error` with red background; fading transition before removal

## Testing

E2E tests with Playwright (`tests/export-import.spec.js`):
- JSON export schema validation
- Export → reimport round-trip
- Import of custom 3-note layout
- Invalid JSON handling (no crash)
- SVG export

Run: `npm test` (requires local HTTP server on :3000)
