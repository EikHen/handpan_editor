# Handpan Explorer — HAT Editor Integration

## Problem

The current app ("Handpan Scale Generator v2") contains a built-in rhythm panel that partially
reimplements the HAT editor: a custom parser, serializer, playback engine, and pattern library,
totalling roughly 2 500 lines. This is a maintenance liability that will diverge from the canonical
HAT spec over time. More importantly, the rhythm panel is **isolated** from the rest of the
explorer: playing a rhythm does not illuminate the corresponding notes on the pan canvas, and
changing the pan's scale does not update the note set available in the rhythm editor. Players who
want to use rhythm and pitch exploration together must do so entirely in their head.

## Evidence

- Direct code audit: `src/editor.html` (7 435 lines) contains a full HAT parser, serializer, audio
  engine, and grid editor that duplicate `hat_spec/src/editor.html` (≈100 KB).
- The built-in parser is behind spec (references `v1.2.2` / `v1.3.0`; current HAT spec is `v1.3.4`).
- The built-in audio engine uses primitive sine oscillators; the HAT editor uses a richer
  noise-burst + filtered synthesis model with chord stacking, tap-tempo, and 60-level undo.
- The HAT editor has features that don't exist in the built-in panel: section repeat labels,
  live source panel, TAP tempo, chord notation cells, keyboard shortcuts panel, per-hit dynamics.

## Users

- **Primary**: Handpan players (beginner to intermediate) who explore scales, chords, and
  progressions in the app and also want to work on rhythms in the same tool — without switching
  apps or mentally re-mapping note positions.
- **Not for**: Percussionists with no interest in handpan pitch; users who only need a standalone
  rhythm notation tool (they use `hat_spec` directly).

## Hypothesis

We believe **embedding the HAT editor as the rhythm panel, connected to the pan canvas via a
bidirectional postMessage protocol**, will give players a richer, canonical rhythm editor that stays
in sync with their scale, eliminates the duplicate codebase, and makes the rhythm ↔ pitch
connection tangible and interactive.

We'll know we're right when:
- A player can select a scale in the explorer, open the rhythm tab, and immediately see their pan's
  notes available as selectable hits in the HAT editor — without any manual configuration.
- During HAT playback, pitched hits cause the corresponding note on the pan canvas to light up in
  real time.
- All built-in rhythm panel code (parser, serializer, audio engine, grid editor) is deleted.

## Success Metrics

| Metric | Target | How measured |
|---|---|---|
| Duplicate rhythm code removed | 100 % of built-in parser / serializer / editor deleted | Line diff on merge |
| Note sync latency (scale change → HAT editor) | < 100 ms | Manual stopwatch test |
| Pan highlight timing accuracy | Note lit within one audio lookahead (~120 ms) of strike | Visual inspection during playback |
| HAT spec compliance | Editor passes its own `tests/` suite at pinned commit | Run `tests/` in submodule |
| Standalone usability | `vendor/hat_spec/src/editor.html` opens without errors in a fresh tab | Manual browser test |

## Scope

### MVP

1. **Rename** the app to "Handpan Explorer" — `<title>`, toolbar `<h1>`, `index.html`.
2. **Add `hat_spec` as a git submodule** at `vendor/hat_spec/`, pinned to the commit that
   includes the postMessage API described below.
3. **Implement a postMessage API in the HAT editor** (see §HAT Editor Changes Required).
4. **Replace** the rhythm panel HTML/JS/CSS with a single
   `<iframe id="hat-frame" src="../vendor/hat_spec/src/editor.html?embed=1">`.
5. **Scale sync (host → editor)**: when the pan layout changes, the host sends `hat:set-notes`
   to the iframe.
6. **Pan note highlighting (editor → host)**: on `hat:hit` events, the host lights up the struck
   note on the pan canvas SVG.
7. **Library migration**: the host's bundled `HAT_PATTERNS` array is sent to the iframe via
   `hat:load-library` on first load, so the HAT editor's own library browser is pre-seeded.

### Out of scope

- **MIDI I/O** — deferred; not blocking core integration.
- **Audio recording / WAV export** — deferred.
- **Multi-track / arrangement view** — deferred; patterns remain one-at-a-time.
- **Community / cloud library sync** — deferred; library stays in localStorage.
- **Fine-grained CSS token injection** — dark/light mode toggle is sufficient for MVP.
- **Chord-progression → rhythm auto-suggest** — deferred; requires separate product design.

---

## HAT Editor Changes Required

This is the **concrete, agent-ready specification** for changes to `hat_spec/src/editor.html`.
Every change is purely additive. Standalone operation must remain fully intact.

---

### H-1 · Embed Mode Detection

Add to the editor's initialization block:

```js
const EMBED_MODE = (window.parent !== window) ||
  (new URLSearchParams(location.search).get('embed') === '1');
```

`EMBED_MODE` gates all postMessage behavior. No UI elements are hidden or altered in embed mode —
the editor looks and behaves identically; only the messaging layer activates.

---

### H-2 · Incoming postMessage Handler

Add one `window.addEventListener('message', handler)`. Guard:

```js
if (!EMBED_MODE) return;
if (event.source !== window.parent) return;
```

Accept and ignore unknown `type` values (log at `console.debug` level only, never `warn`/`error`).

#### `hat:set-notes`

```jsonc
{
  "type": "hat:set-notes",
  "notes": ["D4", "A4", "Bb4", "C5", "D5", "E5", "F5", "G5"],
  "noteNumbers": [1, 2, 3, 4, 5, 6, 7, 8]   // optional; if absent, assign 1…N
}
```

- Updates `;;notes:` and `;;note-numbers:` on the **currently active pattern's live model**.
- Stores the note list as the **session default** applied to every subsequently created pattern.
- After applying, emits `hat:pattern-changed` (see H-3).

#### `hat:load-pattern`

```jsonc
{
  "type": "hat:load-pattern",
  "hat": ";;HAT v1.3.4\n;;title: My Pattern\n...",
  "id": "stable-id-optional"
}
```

- Loads the HAT text programmatically, same flow as the existing Import modal.
- If `id` matches an existing pattern in the library, replace it; otherwise add as new custom pattern.
- Emits `hat:pattern-changed` after loading.

#### `hat:load-library`

```jsonc
{
  "type": "hat:load-library",
  "patterns": [
    { "id": "groove-basic-4-4", "hat": ";;HAT v1.3.4\n...", "category": "grooves" }
  ],
  "merge": true
}
```

- Bulk-injects patterns into the library browser.
- `merge: true` → skip any pattern whose `id` is already present (idempotent on reload).
- `merge: false` → replace all non-user patterns.
- Does **not** change the currently active editing pattern.

#### `hat:set-theme`

```jsonc
{ "type": "hat:set-theme", "mode": "dark" | "light" }
```

- Applies the editor's existing dark/light theme switch.
- Any additional `vars` key is accepted but ignored for now (log a single `console.debug` note).

#### `hat:ping`

```jsonc
{ "type": "hat:ping" }
```

- Responds with `hat:ready`. Used by the host to confirm the iframe survived a navigation.

---

### H-3 · Outgoing postMessage Emitter

Add a single helper function:

```js
function _postToHost(msg) {
  if (!EMBED_MODE) return;
  window.parent.postMessage({ version: 1, ...msg }, '*');
}
```

All outgoing messages carry `"version": 1`. Future breaking changes bump the version; additive
fields do not.

#### `hat:ready`

Emitted once when `DOMContentLoaded` initialization is complete (patterns loaded, audio context
available).

```jsonc
{ "version": 1, "type": "hat:ready", "specVersion": "1.3.4" }
```

#### `hat:pattern-changed`

Emitted whenever the active pattern text changes. **Debounced to 250 ms** to avoid flooding during
rapid editing.

```jsonc
{
  "version": 1,
  "type": "hat:pattern-changed",
  "id": "pattern-uuid",
  "title": "Pattern Title",
  "hat": ";;HAT v1.3.4\n..."
}
```

#### `hat:playback-state`

Emitted when playback starts or stops.

```jsonc
{
  "version": 1,
  "type": "hat:playback-state",
  "playing": true,
  "bpm": 120,
  "grid": "8th"
}
```

#### `hat:hit`  ← most important for pan integration

Emitted from inside `scheduleRhythm()` for **every non-rest cell** that gets scheduled. One
message per hand per column (so up to two per time step when both hands are active).

```jsonc
{
  "version": 1,
  "type": "hat:hit",
  "hand": "R",
  "symbol": "D5",
  "isNote": true,
  "colIndex": 4,
  "barIndex": 1,
  "tOffsetMs": 83.3
}
```

| Field | Meaning |
|---|---|
| `hand` | `"R"` or `"L"` |
| `symbol` | Raw hit value: `"D"`, `"T"`, `"K"`, `"S"`, `"d"`, `"t"`, `"k"`, `"s"`, `"•"`, or a note name like `"D5"` |
| `isNote` | `true` when `symbol` is a pitch name (`symbol.length > 1`) |
| `colIndex` | Zero-based index in the flattened column timeline |
| `barIndex` | Zero-based bar index |
| `tOffsetMs` | `(scheduledAudioTime − audioCtx.currentTime) × 1000`. The host uses this as a `setTimeout` delay to fire the highlight at the exact moment of the strike. |

**Rests (`"-"`) are never emitted.**
Ghost notes (`"•"`) are emitted (host may show a faint highlight at its discretion).

Implementation: emit immediately before each `scheduleHit(t, col.R, ...)` and
`scheduleHit(t, col.L, ...)` call inside the scheduler's lookahead loop.

---

### H-4 · Protocol Stability & Future Extensions

- The host **must** tolerate unknown `type` values and unknown fields within known types.
- The editor **must** tolerate unknown incoming `type` values (silent ignore).
- Reserved message types (do **not** implement now; document as planned):

  | Type | Direction | Purpose |
  |---|---|---|
  | `hat:set-context` | host → editor | Pass current chord/progression so editor can suggest/highlight notes |
  | `hat:cursor-sync` | bidirectional | Sync edit cursor position for future multi-view UX |
  | `hat:export-audio` | host → editor | Request rendered WAV of current pattern |
  | `hat:capabilities` | editor → host | Advertise which optional message types the editor supports |

---

## Host-Side Changes Required (Handpan Explorer)

Requirements only — no implementation detail here; that belongs in `/plan`.

### P-1 · Rename
- `<title>`: "Handpan Explorer"
- Toolbar `<h1>`: "Handpan Explorer"
- `index.html` redirect page title: "Handpan Explorer"

### P-2 · Submodule
- `git submodule add https://github.com/EikHen/hat_spec.git vendor/hat_spec`
- Pin to the commit where H-1 through H-4 are merged.
- Iframe `src`: `../vendor/hat_spec/src/editor.html?embed=1`

### P-3 · iframe Embed
- `#rhythm-panel` becomes an iframe container; all child HTML removed.
- The iframe inherits the panel's existing resize-handle and full-screen expand behavior.
- On `hat:ready`: send `hat:set-notes` (current pan notes) + `hat:load-library` (bundled patterns).
- On `hat:set-theme`: send once on init with the host's current dark/light mode; re-send on theme toggle.

### P-4 · Scale Sync (host → editor)
- Trigger: any change to the pan layout (add/remove/rename note) or load of a scale template.
- Payload: pan notes sorted ascending by MIDI pitch, numbered 1…N.
- Uses the existing `midiNote()` sort already in the host.

### P-5 · Pan Note Highlighting (editor → host)
- On `hat:hit` where `isNote === true`:
  `setTimeout(() => highlightPanNote(symbol), tOffsetMs)`
- `highlightPanNote(label)` adds `.note-playing` to the matching SVG pan note element, removes it
  after 350 ms (configurable; should approximate visual decay for the current audio sustain setting).
- On `hat:playback-state { playing: false }`: clear all `.note-playing` immediately.
- Body hits (D, T, K, S): a generic "body strike" flash on the pan center/edge ring is a
  nice-to-have within MVP; acceptable to defer to Milestone 5b.

### P-6 · Delete Built-in Rhythm Code
Remove from `src/editor.html` (keep shared audio utilities `playNote`, `playChordAudio`,
`playProgression`, `midiNote`, `midiToFreq`, `ensureAudioCtx`):

| What | Identifiers |
|---|---|
| HAT parser | `parseHAT`, `_parseHatLine`, `_parseHatBar`, `_parseHatCell`, `_isNote`, `_isValidHit`, `getParsed`, `_parseCache` |
| HAT serializer | `serializeHAT`, `_cloneModel`, `_reflatten`, `_normGrid`, `_isTripletGrid`, `_toggleTripletGrid`, `doubleSubdivision`, `halveSubdivision`, `_META_ORDER`, `GRID_STEPS`, `GRID_STEPS_TRIPLET` |
| HAT playback | `scheduleRhythm`, `scheduleHit`, `animatePlayhead`, `_playOsc`, `_stepTime`, `_voice`, `_rhyScheduler`, `_playStep`, `_playStartTime`, `rhythmPlaying` |
| HAT data | `HAT_PATTERNS`, `HAT_SCALE_TEMPLATES`, `HAT_HITS`, `_parseCache` |
| Pattern import | `parseMarkdownHAT`, `importHatFile`, `_buildScaleSelect` |
| Grid renderer | All JS functions building `.hat-cell`, `.hat-row`, `.hat-card`, `.rhy-bcard` DOM elements |
| CSS | All rules under selectors `#rhythm-panel`, `.hat-*`, `.rhy-*` (replace with iframe sizing rules) |

---

## Delivery Milestones

| # | Milestone | Outcome | Status | Plan |
|---|---|---|---|---|
| 1 | Rename + submodule | App is "Handpan Explorer"; `vendor/hat_spec/` pinned | in-progress | `.claude/plans/handpan-explorer-hat-integration.plan.md` |
| 2 | HAT editor postMessage API | H-1 through H-4 implemented, tested standalone, merged to `hat_spec` | pending | — |
| 3 | iframe embed + library migration | Rhythm tab shows live HAT editor; bundled patterns seeded | pending | — |
| 4 | Scale sync | Scale change → note list updated in HAT editor < 100 ms | pending | — |
| 5 | Pan note highlighting | Pitched hits light up pan canvas in real time | pending | — |
| 6 | Built-in rhythm code deletion | All duplicate code removed; no regressions | pending | — |

## Open Questions

- [ ] **Origin security**: `postMessage(msg, '*')` is acceptable for a local single-user file. If the app is ever hosted publicly, the host's origin must be pinned. Decision needed before any public hosting.
- [ ] **Pattern library ownership after migration**: Should the host's `HAT_PATTERNS` array be deleted from `src/editor.html` after migration, with `hat_spec/rhythm-library.md` becoming the single source of truth? Or does the host keep a separate embedded copy for offline-first reliability?
- [ ] **Iframe sandboxing**: `sandbox="allow-scripts allow-same-origin"` is sufficient for the HAT editor (needs JS + localStorage). Should `allow-downloads` also be included so the HAT editor's own Export button still works inside the iframe?
- [ ] **Resize handle**: The current rhythm panel has a drag-to-resize vertical handle. Does this survive with the iframe, or does the iframe need explicit `pointer-events` management?
- [ ] **Keyboard focus conflict**: When the iframe is focused, host shortcuts (e.g., spacebar for pan canvas) are shadowed. Is this acceptable, or should the host intercept `Escape` to reclaim focus?
- [ ] **HAT editor theme coupling**: The host uses CSS custom properties (`--surface-panel`, etc.). For MVP, `hat:set-theme { mode: 'dark' | 'light' }` is sufficient. For a more polished look, should the HAT editor eventually accept a subset of the host's design tokens?

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `hat:hit` IPC latency causes audible/visual drift | Medium | Low | Schedule highlights with `tOffsetMs` via `setTimeout`, not `rAF`; add 10 ms fudge for IPC overhead |
| `file://` origin blocks `localStorage` in some browsers | Medium | High | Test on Chrome + Firefox; document workaround (serve via `python -m http.server`) |
| HAT editor postMessage changes regress standalone use | Low | High | Require `hat_spec` tests to pass before merging; manual standalone smoke-test at each milestone |
| Rhythm panel deletion breaks existing user sessions | Low | None | Host pattern state is in-memory only (no localStorage); no migration needed |
| `HAT_PATTERNS` array and `hat_spec/rhythm-library.md` diverge over time | Medium | Low | Delete `HAT_PATTERNS` from host after M-3; treat `rhythm-library.md` as canonical |

---

*Status: DRAFT — requirements only. Implementation planning pending via `/plan`.*
