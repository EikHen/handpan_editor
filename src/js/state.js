/**
 * state.js — Global mutable state and localStorage key constants
 *
 * Globals exported: state, selectedIds, history, histIdx, hlMode, hlChordType,
 *                   hlChordRoot, appMode, exploreTab, activeMood, activeRootPc,
 *                   customProgChords, customProgOpen, progExportRootPcs, enharmonicMode,
 *                   showNoteNumbers, focusNumbers, hatAutoUpdateNotes,
 *                   LS_LAYOUT, LS_SETTINGS, LS_RHYTHMS, LS_WELCOME
 * Depends on:       —
 * Used by:          all modules
 */

// ─── State ────────────────────────────────────────────────────────────────────

let state = { pan: { cx: 500, cy: 500, r: 320 }, notes: [], nextId: 1 };
let selectedIds = new Set();
let history = [], histIdx = -1;

// Highlight state
let hlMode       = 'none';   // 'none' | 'note' | 'chord'
let hlChordType  = 'Major';
let hlChordRoot  = 0;

// Set to true when a layout was successfully restored from localStorage on startup.
// Used by templates.js to skip applying the default template.
let _layoutFromStorage = false;

// App mode state
let appMode    = 'edit';    // 'edit' | 'explore' | 'rhythm'
let exploreTab = 'chords';  // 'chords' | 'progs'

// Progressions / Chords explore state
let activeMood   = 'happy';
let activeRootPc = -1;       // -1 = auto (best root per progression)
let _activeTile  = null;     // { progName, chordIdx } — currently highlighted tile
let activeChordTypeFilter = 'all'; // 'all' | any key of CHORD_TYPES

// Custom progression builder state
let customProgChords   = [];          // [{root: pc, type: typeName}, ...]
let customProgOpen     = false;
let customProgSelIdxs  = new Set();

// Progressions export state
let progExportRootPcs = new Set([-1]); // -1 = auto; multi-select

// Enharmonics state
let enharmonicMode = '-'; // '-' | 'proper' | '#' | 'b'

// Note numbers & HAT auto-update
let showNoteNumbers = false;
let focusNumbers = false;
let hatAutoUpdateNotes = false;

// Note Circle view
let noteCircleActive = false;       // toggle circle vs pan
let noteCircleOrder  = 'chromatic'; // 'chromatic' | 'fifths'
let noteCircleTopPc  = 0;          // pitch class at 12 o'clock
let circleSelectedPcs = new Set(); // selected PCs in circle selection mode

// ─── localStorage persistence ─────────────────────────────────────────────────
const LS_LAYOUT   = 'handpan-layout-v1';
const LS_SETTINGS = 'handpan-settings-v1';
const LS_RHYTHMS  = 'handpan-rhythms-v1';
const LS_WELCOME  = 'handpan-welcome-seen-v1';

