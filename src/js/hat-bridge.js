// ─────────────────────────────────────────────
//  HAT IFRAME BRIDGE  (M3–M5)
// ─────────────────────────────────────────────

var _hatReady = false; // var (not let) — avoids TDZ when called from init IIFE before this line

function _hatFrame() { return document.getElementById('hat-frame'); }

function _hatSend(msg) {
  const fr = _hatFrame();
  if (fr && _hatReady) fr.contentWindow.postMessage(msg, '*');
}

function _hatFrameInit() {
  // If already ready, just sync notes; otherwise wait for hat:ready
  if (_hatReady) {
    _syncHatNotes();
    _hatSendLibrary();
    _hatSendTheme();
  }
  // ping in case the iframe was already loaded before we switched to rhythm mode
  const fr = _hatFrame();
  if (fr) fr.contentWindow.postMessage({ type: 'hat:ping' }, '*');
  // Ensure keyboard events reach the iframe when the mouse enters it.
  // Browsers only route keydown to an iframe if it has focus; hovering alone
  // does not transfer focus.  We push focus from the parent side (the only
  // side that can do it without a user click) on every mouseenter.
  if (fr && !fr._focusListenerAttached) {
    fr._focusListenerAttached = true;
    fr.addEventListener('mouseenter', () => { try { fr.focus(); } catch(_) {} });
  }
}

function _syncHatNotes() {
  if (!_hatReady) return;
  const sorted = [...state.notes].sort((a, b) => midiNote(a.label) - midiNote(b.label));
  const notes = sorted.map(n => n.label);
  const noteNumbers = notes.map((_, i) => i + 1);
  _hatSend({ type: 'hat:set-notes', notes, noteNumbers });
}

function _hatSendLibrary() {
  // HAT editor ships its own built-in PATTERNS array; no host injection needed.
}

function _buildHatThemeVars() {
  // Read live values from colors_and_type.css via getComputedStyle.
  // This ensures the HAT editor always matches the Explorer's actual palette.
  const cs = getComputedStyle(document.documentElement);
  const v = (name, fallback) => cs.getPropertyValue(name).trim() || fallback;
  return {
    // Surfaces — mapped from Explorer tokens
    '--bg':  v('--surface-panel',      '#fbf7ee'), // match #rhythm-panel background
    '--bg2': v('--surface-panel',      '#fbf7ee'), // HAT toolbars/sidebar match Explorer panels
    '--bg3': v('--surface-card-hover', '#fdf9f0'),
    '--bg4': v('--surface-panel-2',    '#f0e8d8'), // hover: slightly warmer/darker than panel
    // Text
    '--fg':  v('--fg-1',     '#3a3027'),
    '--fg2': v('--fg-2',     '#5a4d3e'),
    '--fg3': v('--fg-muted', '#948774'),
    // Accent & border
    '--accent': v('--accent',         '#3d7395'),
    '--border': v('--border-divider', '#ddd2bd'),
    // Right hand
    '--R':    v('--hand-r',       '#2c5e7a'),
    '--Rdim': v('--hand-r-muted', '#7baac4'),
    '--Rbg':  v('--hand-r-fill',  '#e3eaf2'),
    // Left hand
    '--L':    v('--hand-l',       '#8e5828'),
    '--Ldim': v('--hand-l-muted', '#c49a60'),
    '--Lbg':  v('--hand-l-fill',  '#f5e8d5'),
    // Hit colours
    '--hit-D':    v('--hand-r',      '#2c5e7a'),
    '--hit-T':    v('--accent',      '#3d7395'),
    '--hit-K':    v('--hand-l',      '#8e5828'),
    '--hit-S':    v('--danger',      '#c63838'),
    '--hit-note': v('--play-full',   '#1a9966'),
    // Cell backgrounds (no direct Explorer token — keep warm-palette values)
    '--cell-rest-bg':  v('--surface-panel-2', '#f0e8d8'),
    '--cell-D-bg':     v('--hand-r-fill',     '#e3eaf2'),
    '--cell-T-bg':                            '#dce6ef',
    '--cell-K-bg':     v('--hand-l-fill',     '#f5e8d5'),
    '--cell-S-bg':     v('--danger-hover-bg', '#f7e3df'),
    '--cell-ghost-bg': v('--surface-panel-2', '#f0e8d8'),
    '--cell-note-bg':                         '#e6f5e0',
    // Bar
    '--bar-bg':          v('--surface-app',   '#f5efe3'),
    '--bar-border':      v('--border-card',   '#e6dcc6'),
    '--bar-selected-bg': v('--hand-r-fill',   '#e3eaf2'),
    // Separators
    '--sep-beat':     v('--accent',          '#3d7395'),
    '--sep-beat-dim': v('--hand-r-border',   '#b8ccd8'),
    '--sep-sub':      v('--border-divider',  '#ddd2bd'),
    '--sep-sub-dim':  v('--border-card',     '#e6dcc6'),
    // Count tokens
    '--count-tok-fg': v('--hand-r',  '#2c5e7a'),
    '--count-tok-bg': 'rgba(44,94,122,0.12)',
    // Column selection
    '--col-sel-cell':  'rgba(61,115,149,0.15)',
    '--col-sel-strip': 'rgba(61,115,149,0.10)',
    // Overlays
    '--scrim':   'rgba(60,40,20,0.55)',
    '--playing': 'rgba(0,0,0,0.87)',
    // Typography — read directly from colors_and_type.css
    '--font-mono': v('--font-mono', '"Courier New", Courier, ui-monospace, monospace'),
    '--font-ui':   v('--font-sans', 'Arial, "Helvetica Neue", Helvetica, sans-serif'),
  };
}

function _hatSendTheme() {
  if (!_hatReady) return;
  _hatSend({ type: 'hat:set-theme', mode: 'light', vars: _buildHatThemeVars() });
}

// Pan note highlighting
const _playingLayer = document.getElementById('playing-layer');
const _HIGHLIGHT_MS = 350;
let _highlightTimers = {};

function _highlightPanNote(label) {
  const note = state.notes.find(n => n.label === label);
  if (!note) return;
  // Clear any existing timer for this note
  clearTimeout(_highlightTimers[label]);
  // Create or update highlight circle
  let circle = _playingLayer.querySelector(`[data-note="${CSS.escape(label)}"]`);
  if (!circle) {
    const ref = notesLayer.querySelector(`g[data-id="${note.id}"] circle`);
    if (!ref) return;
    circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('data-note', label);
    circle.setAttribute('cx', ref.getAttribute('cx'));
    circle.setAttribute('cy', ref.getAttribute('cy'));
    circle.setAttribute('r', parseFloat(ref.getAttribute('r')) + 4);
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', 'var(--accent, #5b8db8)');
    circle.setAttribute('stroke-width', '3');
    circle.setAttribute('opacity', '0.85');
    circle.setAttribute('pointer-events', 'none');
    _playingLayer.appendChild(circle);
  }
  circle.setAttribute('opacity', '0.85');
  _highlightTimers[label] = setTimeout(() => {
    if (circle.parentNode) circle.parentNode.removeChild(circle);
    delete _highlightTimers[label];
  }, _HIGHLIGHT_MS);
}

function _clearPanHighlights() {
  Object.values(_highlightTimers).forEach(clearTimeout);
  _highlightTimers = {};
  _playingLayer.innerHTML = '';
}

// Incoming messages from HAT iframe
window.addEventListener('message', (event) => {
  const fr = _hatFrame();
  if (!fr || event.source !== fr.contentWindow) return;
  const msg = event.data;
  if (!msg || typeof msg.type !== 'string') return;
  switch (msg.type) {
    case 'hat:ready':
      _hatReady = true;
      _hatSendTheme();
      _syncHatNotes();
      _hatSendLibrary();
      break;
    case 'hat:hit':
      if (msg.isNote) {
        const delay = Math.max(0, (msg.tOffsetMs || 0) - 10);
        const sym = msg.symbol;
        setTimeout(() => {
          _highlightPanNote(sym);
          try {
            const notes = sym.includes('+') ? sym.split('+') : [sym];
            if (notes.length === 1) playNote(notes[0]);
            else playChordAudio(notes);
          } catch(e) {}
        }, delay);
      }
      break;
    case 'hat:playback-state':
      if (!msg.playing) _clearPanHighlights();
      break;
    case 'hat:pattern-changed':
      // future: persist pattern state
      break;
    default:
      // unknown type — ignore
  }
});
