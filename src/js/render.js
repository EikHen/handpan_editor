// ─── History ──────────────────────────────────────────────────────────────────

function snapshot()  { return JSON.stringify({ pan: state.pan, notes: state.notes, nextId: state.nextId, noteNumbers: state.noteNumbers || {} }); }

function pushHistory() {
  history.splice(histIdx + 1);
  history.push(snapshot());
  histIdx = history.length - 1;
  if (history.length > 120) { history.shift(); histIdx--; }
  if (appMode === 'explore') { _initExplorePanel(); }
  scheduleSave();
  if (hatAutoUpdateNotes) _syncHatNotes();
}

function undo() { if (histIdx > 0)                    { histIdx--; restore(history[histIdx]); } }
function redo() { if (histIdx < history.length - 1)   { histIdx++; restore(history[histIdx]); } }

function restore(snap) {
  const d = JSON.parse(snap);
  state.pan = d.pan; state.notes = d.notes; state.nextId = d.nextId;
  state.noteNumbers = d.noteNumbers || {};
  selectedIds.clear(); render(); syncSidebar();
}

// ─── Note helpers ─────────────────────────────────────────────────────────────

function newId() { return `n${state.nextId++}`; }

function addNote(x = 500, y = 320) {
  if (appMode !== 'edit') return;
  const note = { id: newId(), x, y, r: 50, label: rewriteLabel('A3') };
  state.notes.push(note);
  if (!state.noteNumbers) state.noteNumbers = {};
  const usedNums = new Set(Object.values(state.noteNumbers));
  let nextNum = 0;
  while (usedNums.has(nextNum)) nextNum++;
  state.noteNumbers[note.label] = nextNum;
  selectedIds = new Set([note.id]);
  pushHistory(); render(); syncSidebar();
  setTimeout(() => startInlineLabelEdit(note), 40);
}

function deleteSelected() {
  if (appMode !== 'edit') return;
  if (!selectedIds.size) return;
  const deletedLabels = new Set(state.notes.filter(n => selectedIds.has(n.id)).map(n => n.label));
  state.notes = state.notes.filter(n => !selectedIds.has(n.id));
  if (state.noteNumbers) {
    for (const lbl of deletedLabels) {
      // Only delete if no remaining note has this label
      if (!state.notes.some(n => n.label === lbl)) delete state.noteNumbers[lbl];
    }
  }
  selectedIds.clear(); pushHistory(); render(); syncSidebar();
}

function duplicateSelected() {
  if (appMode !== 'edit') return;
  if (!selectedIds.size) return;
  const newIds = new Set(), toAdd = [];
  for (const n of state.notes) {
    if (!selectedIds.has(n.id)) continue;
    const copy = { ...n, id: newId(), x: n.x + 20, y: n.y + 20 };
    toAdd.push(copy); newIds.add(copy.id);
    if (state.noteNumbers && !(copy.label in state.noteNumbers)) {
      const maxNum = Object.values(state.noteNumbers).reduce((m, v) => Math.max(m, v), -1);
      state.noteNumbers[copy.label] = maxNum + 1;
    }
  }
  state.notes.push(...toAdd);
  selectedIds = newIds; pushHistory(); render(); syncSidebar();
}

function selectAll() {
  selectedIds = new Set(state.notes.map(n => n.id)); render(); syncSidebar();
}

// ─── Highlight helpers ────────────────────────────────────────────────────────

// Returns null (no highlight), 'all' (by note), or Set<pitchClass> (chord)
function getHighlightedPcs() {
  if (hlMode === 'none')  return null;
  if (hlMode === 'note')  return 'all';
  if (hlMode === 'chord') {
    const ivs = CHORD_TYPES[hlChordType];
    if (!ivs) return null;
    return new Set(ivs.map(i => (hlChordRoot + i) % 12));
  }
  if (hlMode === 'selection') {
    if (selectedIds.size === 0) return null;
    const pcs = new Set();
    for (const n of state.notes) {
      if (selectedIds.has(n.id)) {
        const pc = parsePitchClass(n.label);
        if (pc >= 0) pcs.add(pc);
      }
    }
    return pcs.size > 0 ? pcs : null;
  }
  return null;
}

// Returns { stroke, strokeW, opacity } for a note given highlight state
function noteVisual(note, isSelected) {
  const hpcs = getHighlightedPcs();
  const pc   = parsePitchClass(note.label);

  if (isSelected) return { stroke: '#f90', strokeW: 3.5, opacity: 1, fill: 'white' };

  // Selection mode: grey out notes that can't form any chord with current selection
  if (hlMode === 'selection' && selectedIds.size > 0) {
    const viable = getViableSelectionPcs();
    if (viable && !viable.has(pc)) {
      return { stroke: '#555', strokeW: 1.5, opacity: 0.2, fill: '#1a1a2e' };
    }
    if (viable && viable.has(pc)) {
      const col = pc >= 0 ? PC_COLORS[pc] : ACCENT;
      return { stroke: col, strokeW: 4, opacity: 1, fill: 'white' };
    }
  }

  if (hpcs === null) return { stroke: ACCENT, strokeW: 2.5, opacity: 1, fill: 'white' };

  if (hpcs === 'all') {
    const col = pc >= 0 ? PC_COLORS[pc] : ACCENT;
    return { stroke: col, strokeW: 5, opacity: 1, fill: 'white' };
  }

  // chord mode — use pitch-class color for chord notes, dim the rest
  if (hpcs.has(pc)) {
    const col = pc >= 0 ? PC_COLORS[pc] : ACCENT;
    return { stroke: col, strokeW: 6, opacity: 1, fill: 'white' };
  }
  return { stroke: '#aaa', strokeW: 2, opacity: 0.3, fill: 'white' };
}

// ─── Rendering ────────────────────────────────────────────────────────────────

const SVG        = document.getElementById('canvas');
const panLayer   = document.getElementById('pan-layer');
const notesLayer = document.getElementById('notes-layer');
const selBox     = document.getElementById('sel-box');

function render() { renderPan(); renderNotes(); }

function renderPan() {
  const { cx, cy, r } = state.pan;
  panLayer.innerHTML =
    `<circle id="pan-circle" cx="${cx}" cy="${cy}" r="${r}"
       fill="#f2f2f2" stroke="#c0c0c0" stroke-width="5" cursor="move"/>
     <circle cx="${cx}" cy="${cy}" r="${Math.max(r-50, Math.round(r*.8))}"
       fill="none" stroke="#e0e0e0" stroke-width="1.5" pointer-events="none"/>`;
  document.getElementById('pan-circle').addEventListener('mousedown', onPanDown);
}

function svgEl(tag, attrs) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function renderNotes() {
  notesLayer.innerHTML = '';
  const single = selectedIds.size === 1;

  for (const note of state.notes) {
    const sel = selectedIds.has(note.id);
    const { stroke, strokeW, opacity, fill } = noteVisual(note, sel);
    const fs = Math.max(10, Math.min(Math.round(note.r * 0.46), 22));

    const g = svgEl('g', { 'data-id': note.id, cursor: 'grab', opacity });

    g.appendChild(svgEl('circle', { cx: note.x, cy: note.y, r: note.r,
      fill, stroke, 'stroke-width': strokeW }));

    const txt = svgEl('text', { x: note.x, y: note.y,
      'text-anchor': 'middle', 'dominant-baseline': 'central',
      'font-family': 'Arial, sans-serif', 'font-size': fs,
      fill: '#222', 'pointer-events': 'none' });
    txt.textContent = fmtLabel(note.label);
    g.appendChild(txt);

    if (showNoteNumbers && state.noteNumbers && state.noteNumbers[note.label] != null) {
      const nfs = Math.max(8, Math.round(fs * 0.7));
      const numTxt = svgEl('text', { x: note.x, y: note.y + note.r * 0.45,
        'text-anchor': 'middle', 'dominant-baseline': 'central',
        'font-family': 'Arial, sans-serif', 'font-size': nfs,
        fill: '#666', cursor: 'pointer' });
      numTxt.textContent = state.noteNumbers[note.label];
      numTxt.addEventListener('dblclick', e => {
        e.stopPropagation();
        if (appMode !== 'edit') return;
        selectedIds = new Set([note.id]); render(); syncSidebar();
        startInlineNumberEdit(note);
      });
      g.appendChild(numTxt);
    }

    if (sel && single) {
      g.appendChild(svgEl('circle', {
        cx: note.x + note.r, cy: note.y, r: 7,
        fill: '#f90', stroke: 'white', 'stroke-width': 1.5,
        cursor: 'ew-resize', class: 'resize-handle', 'data-noteid': note.id,
      }));
    }

    g.addEventListener('mousedown', onNoteDown);
    g.addEventListener('dblclick',  onNoteDblClick);
    notesLayer.appendChild(g);
  }

  // Chord label just below the pan
  if (hlMode === 'chord') {
    const lbl = svgEl('text', {
      x: 500, y: 880,
      'text-anchor': 'middle', 'dominant-baseline': 'middle',
      'font-family': 'Arial, sans-serif', 'font-size': 30,
      'font-weight': 'bold', fill: '#333', 'pointer-events': 'none',
    });
    lbl.textContent = `${CHORD_SYMBOLS[hlChordType] ?? ''} ${getDisplayNames()[hlChordRoot]} ${hlChordType}`;
    notesLayer.appendChild(lbl);
  }
}

// ─── SVG coordinate helper ────────────────────────────────────────────────────

function pt(e) {
  const p = SVG.createSVGPoint();
  p.x = e.clientX; p.y = e.clientY;
  return p.matrixTransform(SVG.getScreenCTM().inverse());
}

