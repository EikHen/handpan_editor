# Plan: Handpan Explorer — HAT Editor Integration

**Source PRD**: `.claude/prds/handpan-explorer-hat-integration.prd.md`
**Selected Milestone**: M1 — Rename + submodule (foundation for all subsequent milestones)
**Complexity**: Large (6 milestones, two repos, ~2 500 lines deleted, bidirectional postMessage protocol)

---

## Summary

Replace the built-in rhythm panel (a ~2 500-line partial reimplementation of the HAT editor) with
an `<iframe>` embedding the canonical HAT editor as a git submodule, connected to the host via a
versioned bidirectional postMessage API. The HAT editor gains an embed-mode messaging layer; the
host gains live scale sync and pan-note highlighting during playback. All milestones are ordered
by dependency — each is a valid stopping point.

---

## Patterns to Mirror

| Category | Source | Pattern |
|---|---|---|
| Naming | `src/editor.html:4071` `setMode()` | camelCase public; `_prefix` for private functions |
| Naming | `src/editor.html:2849` `svgEl()` | Short helper wrapping repeated DOM operations |
| State mutation | `src/editor.html:2716` `pushHistory()` | Every state change calls `render(); syncSidebar()` after mutation |
| CSS visibility | `src/editor.html:1068` | Mode driven by `body[data-mode="rhythm"]` CSS selector, not JS show/hide |
| Error surface | `src/editor.html:5284` | `try/catch` sets `result.ok=false; result.error=e.message` — no throws to caller |
| User feedback | codebase-wide | `showToast(msg)` for transient user-visible messages |
| No test framework | — | Validate with manual browser smoke-test only |

---

## Open Questions to Resolve Before Coding

1. **`file://` vs HTTP**: Does this app run from `file://` or a local server? `localStorage` and
   `<iframe>` both work on `file://` in Chrome but may fail in Firefox. Verify before M3.
2. **`stopPlay` shared?**: The existing `stopPlay()` function may be called from both the rhythm
   panel and the chord/progression explorer audio. Audit callers before deleting in M6.
3. **`allow-downloads` sandbox flag**: The HAT editor's Export button downloads a `.hat.txt`. The
   `<iframe sandbox>` must include `allow-downloads` or the Export button silently fails.

---

## Files to Change

| File | Repo | Action | Why |
|---|---|---|---|
| `index.html` | host | UPDATE | Rename title |
| `src/editor.html` | host | UPDATE (large) | Rename; iframe embed; host messaging; note highlighting; rhythm code deletion |
| `vendor/hat_spec/src/editor.html` | hat_spec submodule | UPDATE | Add postMessage API (M2) |
| `.gitmodules` | host | CREATE | Submodule registration |
| `.claude/prds/handpan-explorer-hat-integration.prd.md` | host | UPDATE | Mark M1 in-progress, add plan path |

---

## Milestone Overview

| # | Milestone | Scope |
|---|---|---|
| M1 | Rename + submodule | Host repo only. Trivial. No functional change. |
| M2 | HAT editor postMessage API | `vendor/hat_spec/src/editor.html` (submodule). Commit there first. |
| M3 | iframe embed + library migration | Host: replace rhythm panel HTML/JS with iframe + seed on `hat:ready`. |
| M4 | Scale sync | Host: send `hat:set-notes` on every pan note change. |
| M5 | Pan note highlighting | Host: listen for `hat:hit`; pulse SVG `playing-layer`. |
| M6 | Delete built-in rhythm code | Host: remove parser/serializer/playback/renderer/data. |

---

## Tasks

---

### M1-1 · Rename to "Handpan Explorer"

**Files**: `index.html`, `src/editor.html`

**Exact changes**:

`index.html` line 11:
```diff
-<title>Handpan Scale Generator v2</title>
+<title>Handpan Explorer</title>
```

`src/editor.html` line 23:
```diff
-<title>Handpan Layout Editor</title>
+<title>Handpan Explorer</title>
```

`src/editor.html` line 1117:
```diff
-  <h1>Handpan Editor</h1>
+  <h1>Handpan Explorer</h1>
```

**Validate**: Open `index.html` → browser tab reads "Handpan Explorer". Open `src/editor.html` → toolbar h1 reads "Handpan Explorer".

---

### M1-2 · Add hat_spec git submodule

**Action** (shell, run once):
```bash
git submodule add https://github.com/EikHen/hat_spec.git vendor/hat_spec
git submodule update --init --recursive
```

After M2 is merged into `hat_spec`, pin to that commit:
```bash
cd vendor/hat_spec && git checkout <sha-of-postMessage-commit> && cd ../..
git add vendor/hat_spec .gitmodules
```

**Validate**: `vendor/hat_spec/src/editor.html` exists. Opening it in a fresh browser tab shows the standalone HAT editor with no console errors.

---

### M2-1 · Embed mode detection (in `vendor/hat_spec/src/editor.html`)

Find the initialization block near `DOMContentLoaded`. Add before any other code runs:

```js
// ─── Embed mode ───────────────────────────────────────────────────────────────
const EMBED_MODE = (window.parent !== window) ||
  (new URLSearchParams(location.search).get('embed') === '1');
```

No UI changes. Standalone: `EMBED_MODE = false`. Embedded: `EMBED_MODE = true`.

**Validate**: Open with `?embed=1` → `EMBED_MODE` is `true` in console. Open standalone → `false`.

---

### M2-2 · Outgoing emitter + `hat:ready`

Add immediately after the `EMBED_MODE` declaration:

```js
function _postToHost(msg) {
  if (!EMBED_MODE) return;
  window.parent.postMessage({ version: 1, ...msg }, '*');
}
```

At the end of `DOMContentLoaded` initialization (after patterns load, after audio context ready):
```js
_postToHost({ type: 'hat:ready', specVersion: '1.3.4' });
```

**Validate**: Embed in test iframe; parent `window.addEventListener('message', e => console.log(e.data))` → sees `{version:1, type:'hat:ready', specVersion:'1.3.4'}`.

---

### M2-3 · `hat:pattern-changed` (debounced 250 ms)

Hook into the existing path that saves/updates the active pattern. Add:

```js
let _patChangedTimer = null;
function _emitPatternChanged() {
  clearTimeout(_patChangedTimer);
  _patChangedTimer = setTimeout(() => {
    _postToHost({
      type:  'hat:pattern-changed',
      id:    /* existing active-pattern-id variable */,
      title: /* existing active-pattern-title variable */,
      hat:   /* call existing serializer on current model */,
    });
  }, 250);
}
```

Call `_emitPatternChanged()` wherever the pattern currently gets persisted to `localStorage`.

**Note**: Read the HAT editor source to find exact variable names (`activeId`, `activePattern`, etc.) before coding.

---

### M2-4 · `hat:playback-state`

Find the existing play/stop toggle. Add one call at start and one at stop:

```js
// on play start:
_postToHost({ type: 'hat:playback-state', playing: true,  bpm: currentBpm, grid: currentGrid });
// on play stop:
_postToHost({ type: 'hat:playback-state', playing: false, bpm: currentBpm, grid: currentGrid });
```

**Validate**: Press play in embedded editor → parent receives `{playing:true}`. Press stop → `{playing:false}`.

---

### M2-5 · `hat:hit` in the playback scheduler

Inside the lookahead `while` loop of `scheduleRhythm()`, before each `scheduleHit()` call:

```js
if (col.R.hit !== '-') {
  _postToHost({
    type: 'hat:hit', hand: 'R',
    symbol:   col.R.hit,
    isNote:   col.R.hit.length > 1,
    colIndex: (_playStep % cols.length + cols.length) % cols.length,
    barIndex: col.barIndex ?? 0,
    tOffsetMs: Math.max(0, (t - audioCtx.currentTime) * 1000),
  });
}
// identical block for col.L.hit, hand: 'L'
```

Rests (`"-"`) are never emitted.

**Validate**: During embedded playback, parent receives `hat:hit` stream with positive `tOffsetMs` values (≤ 120 ms lookahead window).

---

### M2-6 · Incoming postMessage handler

```js
window.addEventListener('message', (event) => {
  if (!EMBED_MODE) return;
  if (event.source !== window.parent) return;
  const msg = event.data;
  if (!msg || typeof msg.type !== 'string') return;

  switch (msg.type) {
    case 'hat:ping':
      _postToHost({ type: 'hat:ready', specVersion: '1.3.4' });
      break;
    case 'hat:set-theme':
      if (msg.mode === 'dark' || msg.mode === 'light') applyTheme(msg.mode);
      break;
    case 'hat:set-notes':   _handleSetNotes(msg);   break;
    case 'hat:load-pattern':_handleLoadPattern(msg); break;
    case 'hat:load-library':_handleLoadLibrary(msg); break;
    default:
      console.debug('[HAT embed] unknown message:', msg.type);
  }
});
```

**Implement `_handleSetNotes(msg)`**:
- Validate `msg.notes` is a non-empty string array.
- Assign `noteNumbers = msg.noteNumbers || msg.notes.map((_,i)=>i+1)`.
- Update active pattern's `;;notes:` + `;;note-numbers:` via the model mutation path.
- Store as session default for new patterns.
- Call `_emitPatternChanged()`.

**Implement `_handleLoadPattern(msg)`**:
- Validate `msg.hat` is a string.
- Run through the existing import flow (same as Import modal "Load").
- Use `msg.id` as pattern ID if provided; otherwise generate UUID.
- Call `_emitPatternChanged()`.

**Implement `_handleLoadLibrary(msg)`**:
- Validate `msg.patterns` is an array.
- For each entry: if `msg.merge !== false`, skip IDs already in the library.
- Inject into library data structure; refresh library browser UI.
- Do **not** change the active editing pattern.

**Validate**: From parent: `frame.contentWindow.postMessage({type:'hat:set-notes',notes:['D4','A4']},'*')` → HAT editor note picker shows only D4 and A4.

---

### M3-1 · Replace rhythm panel HTML with iframe

**File**: `src/editor.html`, starting at line 1459.

Replace the entire inner content of `<div id="rhythm-panel">` (keep the outer div) with:

```html
  <iframe
    id="hat-frame"
    src="../vendor/hat_spec/src/editor.html?embed=1"
    sandbox="allow-scripts allow-same-origin allow-downloads"
    style="width:100%;height:100%;border:none;display:block;"
    title="HAT Rhythm Editor"
  ></iframe>
```

Remove `<input type="file" id="hat-import-input">` at line 1511 (no longer needed).

**Validate**: Rhythm tab → HAT editor appears full-size. Full-screen expand (`#rhy-expand-btn` or equivalent) still works — it is CSS-driven (`#rhythm-panel.expanded`), no JS change needed.

---

### M3-2 · Update `setMode('rhythm')` in host

`src/editor.html`, function `setMode` (line 4084):

```diff
  } else if (mode === 'rhythm') {
-   buildCatPills(); renderRhythms();
+   _hatFrameInit();
  }
```

Cleanup block (line 4089), remove rhythm-specific teardown that no longer applies:
```diff
    if (prev === 'rhythm') {
-     stopPlay();
-     const panel = document.getElementById('rhythm-panel');
-     panel.classList.remove('expanded');
-     _autoSaveEdit();
-     activeHatIdx = null; _editModel = null; editMsg = '';
-     const eb = document.getElementById('rhy-expand-btn');
-     if (eb) eb.innerHTML = '...maximize icon...';
+     // HAT editor manages its own playback; host has nothing to clean up
    }
```

---

### M3-3 · Host postMessage bridge + library seed

Add a new section `// ─── HAT iframe bridge ───────────────────────────────────────────────────` in `src/editor.html` (just before the DOMContentLoaded / init block):

```js
// ─── HAT iframe bridge ────────────────────────────────────────────────────────

let _hatReady = false;

function _hatFrame() { return document.getElementById('hat-frame'); }

function _postToHat(msg) {
  const f = _hatFrame();
  if (!f || !f.contentWindow) return;
  f.contentWindow.postMessage(msg, '*');
}

function _hatFrameInit() {
  // Called when user switches to Rhythm tab. iframe persists, so only seed once.
  if (!_hatReady) return; // seed deferred until hat:ready fires
  _syncHatNotes();
}

function _syncHatNotes() {
  const sorted = [...state.notes]
    .filter(n => n.label && n.label.trim())
    .sort((a, b) => midiNote(a.label) - midiNote(b.label));
  _postToHat({
    type:        'hat:set-notes',
    notes:       sorted.map(n => n.label),
    noteNumbers: sorted.map((_, i) => i + 1),
  });
}

function _seedHatLibrary() {
  _postToHat({
    type:     'hat:load-library',
    patterns: HAT_PATTERNS.map(p => ({ id: p.id, hat: p.hat, category: p.cat || 'library' })),
    merge:    true,
  });
}

window.addEventListener('message', (event) => {
  const f = _hatFrame();
  if (!f || event.source !== f.contentWindow) return;
  const msg = event.data;
  if (!msg || typeof msg.type !== 'string') return;

  switch (msg.type) {
    case 'hat:ready':
      _hatReady = true;
      _syncHatNotes();
      _seedHatLibrary();
      break;
    case 'hat:hit':
      if (msg.isNote) setTimeout(() => _highlightPanNote(msg.symbol), Math.max(0, msg.tOffsetMs - 10));
      break;
    case 'hat:playback-state':
      if (!msg.playing) _clearPanHighlights();
      break;
    default:
      break;
  }
});
```

**Validate**: Open Rhythm tab → console shows `hat:ready` received. Library browser in HAT editor contains bundled patterns.

---

### M4-1 · Scale sync hook

In `pushHistory()` (line ~2716), after `render(); syncSidebar()`:

```diff
+   if (_hatReady) _syncHatNotes();
```

Also find the template `<select>` `onchange` handler and add the same call after it applies the template.

**Validate**: Add a note to the pan → switch to Rhythm tab → new note appears in HAT editor note picker within 100 ms.

---

### M5-1 · Pan note highlight layer

**Step 1**: In the SVG element that contains `notesLayer`, add a sibling layer **after** `notesLayer`:
```html
<g id="playing-layer" pointer-events="none"></g>
```

**Step 2**: Add to the HAT bridge section:

```js
const _playingTimeouts = new Map();

function _highlightPanNote(label) {
  const note = state.notes.find(n => n.label === label);
  if (!note) return;
  const layer = document.getElementById('playing-layer');

  // Remove any existing highlight for this note
  layer.querySelector(`[data-hl="${CSS.escape(label)}"]`)?.remove();
  if (_playingTimeouts.has(label)) clearTimeout(_playingTimeouts.get(label));

  const el = svgEl('circle', {
    cx: note.x, cy: note.y, r: note.r + 6,
    fill: 'none',
    stroke: 'var(--accent, #5b8db8)',
    'stroke-width': 3,
    opacity: 0.85,
    'data-hl': label,
  });
  layer.appendChild(el);

  const tid = setTimeout(() => { el.remove(); _playingTimeouts.delete(label); }, 350);
  _playingTimeouts.set(label, tid);
}

function _clearPanHighlights() {
  for (const tid of _playingTimeouts.values()) clearTimeout(tid);
  _playingTimeouts.clear();
  const layer = document.getElementById('playing-layer');
  if (layer) layer.innerHTML = '';
}
```

**Implementation note**: `playing-layer` is separate from `notesLayer`. `renderNotes()` rebuilds only `notesLayer`, so highlights survive re-renders. If a note is repositioned during playback, the highlight will be momentarily mispositioned — acceptable for MVP.

**Validate**: Play a HAT pattern with note hits (e.g., D Kurd) → corresponding pan note circles briefly glow with accent-colored ring, timed to beats.

---

### M6-1 · Delete built-in rhythm code

Work bottom-up through `src/editor.html` to avoid line-number drift.

**JavaScript to delete** (search by name, delete entire function + comment header):

| Group | Identifiers |
|---|---|
| Rhythm state vars | `rhythmPlaying`, `_playStep`, `_playStartTime`, `_rhyScheduler`, `ghostVol`, `activeHatIdx`, `_editModel`, `editMsg`, `_rhyBrowserOpen`, `activeHatCat`, `hatSearchQuery` |
| HAT data | `HAT_HITS`, `HAT_SCALE_TEMPLATES`, `HAT_PATTERNS` (large array), `_parseCache` |
| Parser | `_isNote`, `_isValidHit`, `_parseHatCell`, `_parseHatBar`, `_parseHatLine`, `parseHAT`, `getParsed`, `_hatRoundTripTest` |
| Serializer | `_normGrid`, `_isTripletGrid`, `_toggleTripletGrid`, `GRID_STEPS`, `GRID_STEPS_TRIPLET`, `_META_ORDER`, `_cloneModel`, `_reflatten`, `serializeHAT`, `_restCol`, `doubleSubdivision`, `halveSubdivision` |
| Playback | `_voice`, `_playOsc`, `secPerCell`, `scheduleHit`, `_stepTime`, `scheduleRhythm`, `animatePlayhead`, `stopPlay`, `startPlay` (if rhythm-only — verify first) |
| Import/UI | `parseMarkdownHAT`, `importHatFile`, `_buildScaleSelect`, `buildCatPills`, `renderRhythms`, `toggleRhyBrowser`, `toggleRhythmExpand`, `_autoSaveEdit`, and all `_renderHatGrid`/`renderHat*` helpers |

**Keep** (shared): `playNote`, `playChordAudio`, `playProgression`, `midiNote`, `midiToFreq`, `ensureAudioCtx`, `_audioCtx`

**CSS to delete**: All rule blocks for `.hat-*`, `.rhy-*`, `#rhythm-panel` (old structure). Replace with:
```css
/* ── Rhythm Panel (iframe) ───────────────────────── */
#rhythm-panel { background:var(--surface-panel); border-top:1px solid var(--border-divider); display:none; flex-direction:column; min-height:260px; position:relative; }
#rhythm-panel.open { display:flex; }
body[data-mode="rhythm"] #workspace-row { display:none; }
body[data-mode="rhythm"] #rhythm-panel { display:flex; flex:1; height:auto !important; min-height:0 !important; flex-shrink:1; }
#rhythm-panel.expanded { position:fixed; inset:0; height:100vh !important; z-index:2000; border-top:none; }
```

**Validate**: No JS `ReferenceError` in console on any tab. Line count drops by ~2 000–2 500 lines.

---

## Validation

```
Manual smoke tests (open src/editor.html in browser):

[ ] Title reads "Handpan Explorer"
[ ] Toolbar h1 reads "Handpan Explorer"
[ ] Pan tab: add / move / rename notes — renders correctly
[ ] Explore tab: chords and progressions work, playback works
[ ] Rhythm tab: HAT editor loads in iframe, no console errors
[ ] Rhythm tab: HAT editor library browser shows bundled patterns
[ ] Rhythm tab: note picker reflects current pan's notes
[ ] Change pan note → Rhythm tab → updated note visible in HAT editor (< 100 ms)
[ ] Play pattern with named note hits → pan notes pulse with accent ring
[ ] Stop playback → all highlights cleared immediately
[ ] HAT editor Export button → .hat.txt download works inside iframe
[ ] Open vendor/hat_spec/src/editor.html directly → fully functional standalone
```

---

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| `file://` + `localStorage` blocked in Firefox | Medium | Test early; document "serve via HTTP" workaround |
| `hat:hit` postMessage rate at 32nd-note resolution | Low | ~64 msg/s at 120 BPM; well within browser IPC budget |
| `playing-layer` highlights mispositioned after note move | Low | Acceptable for MVP; next hit event corrects position |
| Deleting `stopPlay` breaks chord-panel audio | Medium | Audit callers before deleting; keep if shared |
| `renderNotes()` called during highlight lifetime | Low | Highlights in `playing-layer`, not `notesLayer`; immune |

---

## Acceptance

- [ ] M1: Title + h1 = "Handpan Explorer"; `vendor/hat_spec/` submodule present and pinned
- [ ] M2: `hat:ready`, `hat:hit`, `hat:set-notes`, `hat:load-library` verified in embedded editor
- [ ] M3: Rhythm tab shows live HAT editor; bundled patterns seeded on first load
- [ ] M4: Scale change → note picker updated in HAT editor within 100 ms
- [ ] M5: Pitched hits → pan notes pulse; stop → highlights clear immediately
- [ ] M6: No duplicate rhythm code remains; no JS errors; file ~2 000+ lines shorter
- [ ] Standalone: `vendor/hat_spec/src/editor.html` fully functional with no errors
