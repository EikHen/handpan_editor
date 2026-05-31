// ─── Interaction ──────────────────────────────────────────────────────────────

let iact = null, nudgeTimer = null;

function onNoteDown(e) {
  // In explore mode + By Selection highlight: allow click-to-select notes without mutation
  if (appMode === 'explore' && hlMode === 'selection') {
    e.stopPropagation();
    const id = e.currentTarget.getAttribute('data-id');
    if (e.shiftKey) {
      selectedIds.has(id) ? selectedIds.delete(id) : selectedIds.add(id);
    } else {
      selectedIds = new Set([id]);
    }
    render(); updateSelectionInfo();
    return;
  }
  if (appMode === 'explore') {
    const id = e.currentTarget.getAttribute('data-id');
    const note = state.notes.find(n => n.id === id);
    if (note) { playNote(note.label); e.preventDefault(); }
    return;
  }
  if (appMode !== 'edit') return;
  const p0 = pt(e);   // capture before any DOM mutation

  if (e.target.classList.contains('resize-handle')) {
    e.stopPropagation();
    const note = state.notes.find(n => n.id === e.target.getAttribute('data-noteid'));
    iact = { type: 'resize', note, origR: note.r, x0: p0.x };
    e.preventDefault(); return;
  }

  e.stopPropagation();
  const id = e.currentTarget.getAttribute('data-id');
  const note = state.notes.find(n => n.id === id);
  if (!note) return;

  if (e.altKey) { playNote(note.label); e.preventDefault(); return; }

  if (e.shiftKey) {
    selectedIds.has(id) ? selectedIds.delete(id) : selectedIds.add(id);
    render(); syncSidebar(); return;
  }

  if (!selectedIds.has(id)) { selectedIds = new Set([id]); render(); syncSidebar(); }

  const origPos = {};
  for (const n of state.notes) if (selectedIds.has(n.id)) origPos[n.id] = { x: n.x, y: n.y };
  iact = { type: 'move', x0: p0.x, y0: p0.y, origPos, moved: false };
  e.preventDefault();
}

function onPanDown(e) {
  if (appMode !== 'edit') return;
  e.stopPropagation();
  const p0 = pt(e);
  iact = { type: 'pan-move', x0: p0.x, y0: p0.y, origCx: state.pan.cx, origCy: state.pan.cy, moved: false };
  e.preventDefault();
}

document.getElementById('bg').addEventListener('mousedown', e => {
  const p0 = pt(e);
  if (!e.shiftKey) {
    const wasSelMode = appMode === 'explore' && hlMode === 'selection' && selectedIds.size > 0;
    selectedIds.clear(); render(); syncSidebar();
    if (wasSelMode) updateSelectionInfo();
  }
  iact = { type: 'box', x0: p0.x, y0: p0.y };
  e.preventDefault();
});

document.addEventListener('mousemove', e => {
  if (!iact) return;
  const p = pt(e);

  if (iact.type === 'move') {
    const dx = p.x - iact.x0, dy = p.y - iact.y0;
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) iact.moved = true;
    for (const n of state.notes) {
      if (!selectedIds.has(n.id)) continue;
      const o = iact.origPos[n.id];
      n.x = Math.round(o.x + dx); n.y = Math.round(o.y + dy);
    }
    renderNotes();

  } else if (iact.type === 'resize') {
    iact.note.r = Math.max(14, Math.round(iact.origR + (p.x - iact.x0)));
    renderNotes(); syncSidebar();

  } else if (iact.type === 'pan-move') {
    const dx = p.x - iact.x0, dy = p.y - iact.y0;
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) iact.moved = true;
    state.pan.cx = Math.round(iact.origCx + dx);
    state.pan.cy = Math.round(iact.origCy + dy);
    renderPan();

  } else if (iact.type === 'box') {
    const x = Math.min(iact.x0, p.x), y = Math.min(iact.y0, p.y);
    const w = Math.abs(p.x - iact.x0),  h = Math.abs(p.y - iact.y0);
    selBox.setAttribute('x', x); selBox.setAttribute('y', y);
    selBox.setAttribute('width', w); selBox.setAttribute('height', h);
    selBox.setAttribute('visibility', 'visible');
    iact.box = { x, y, w, h };
  }
});

document.addEventListener('mouseup', () => {
  if (!iact) return;
  if (iact.type === 'move'     && iact.moved)  pushHistory();
  if (iact.type === 'resize')                  { pushHistory(); syncSidebar(); }
  if (iact.type === 'pan-move') {
    if (iact.moved) pushHistory();
    else            { selectedIds.clear(); render(); syncSidebar(); }
  }
  if (iact.type === 'box') {
    selBox.setAttribute('visibility', 'hidden');
    const b = iact.box;
    if (b && (b.w > 4 || b.h > 4)) {
      for (const n of state.notes)
        if (n.x >= b.x && n.x <= b.x+b.w && n.y >= b.y && n.y <= b.y+b.h)
          selectedIds.add(n.id);
    }
    render(); syncSidebar();
  }
  iact = null;
});

function onNoteDblClick(e) {
  if (appMode !== 'edit') return;
  const id = e.currentTarget.getAttribute('data-id');
  const note = state.notes.find(n => n.id === id);
  if (!note) return;
  selectedIds = new Set([id]); render(); syncSidebar();
  startInlineLabelEdit(note);
}

// ─── Sidebar sync ─────────────────────────────────────────────────────────────

function syncSidebar() {
  const n = selectedIds.size;
  document.getElementById('props-empty').style.display  = n === 0 ? '' : 'none';
  document.getElementById('props-single').style.display = n === 1 ? '' : 'none';
  document.getElementById('props-multi').style.display  = n > 1  ? '' : 'none';

  if (n === 1) {
    const note = state.notes.find(nd => selectedIds.has(nd.id));
    if (note) {
      document.getElementById('prop-label').value = note.label;
      document.getElementById('prop-r').value     = note.r;
      document.getElementById('prop-r-val').textContent = note.r;
      const propNum = document.getElementById('prop-num');
      if (propNum) propNum.value = (state.noteNumbers && state.noteNumbers[note.label] != null) ? state.noteNumbers[note.label] : '';
    }
  }
  if (n > 1) document.getElementById('hint-multi').textContent = `${n} notes selected`;

  document.getElementById('status').textContent =
    n === 0 ? `${state.notes.length} notes` : n === 1 ? '1 selected' : `${n} selected`;

  // Pan name + note count panel
  const panNameEl = document.getElementById('pan-name');
  if (panNameEl) panNameEl.value = state.pan.name || '';
  const panCountEl = document.getElementById('pan-note-count');
  if (panCountEl) panCountEl.textContent = `${state.notes.length} notes`;

  updateHighlightPanel();
}

function updateHighlightPanel() {
  document.getElementById('note-legend-wrap').style.display = hlMode !== 'none' ? '' : 'none';
  document.getElementById('hl-note-opts').style.display     = hlMode === 'note'  ? '' : 'none';
  document.getElementById('hl-chord-opts').style.display    = hlMode === 'chord' ? '' : 'none';
  document.getElementById('hl-selection-opts').style.display = hlMode === 'selection' ? '' : 'none';

  if (hlMode !== 'none') buildNoteLegend();
  if (hlMode === 'chord') updateChordInfo();
  if (hlMode === 'selection') updateSelectionInfo();
}

// ─── Color palette popup ──────────────────────────────────────────────────────

let _colorPopup = null;

function closeColorPopup() {
  if (_colorPopup) { _colorPopup.remove(); _colorPopup = null; }
}

function showColorPopup(pc, anchor) {
  closeColorPopup();

  const popup = document.createElement('div');
  popup.style.cssText = [
    'position:fixed;z-index:10000;',
    'background:#1a1a2e;border:1px solid #3a4060;border-radius:6px;',
    'padding:8px;box-shadow:0 6px 24px rgba(0,0,0,.7);',
  ].join('');
  popup.addEventListener('click', e => e.stopPropagation());

  // Palette grid
  const grid = document.createElement('div');
  grid.style.cssText = 'display:grid;grid-template-columns:repeat(5,20px);gap:3px;margin-bottom:7px;';
  for (const col of PALETTE) {
    const sq = document.createElement('div');
    const active = col === PC_COLORS[pc];
    sq.style.cssText = `width:20px;height:20px;border-radius:3px;background:${col};cursor:pointer;` +
      `box-shadow:${active ? '0 0 0 2px #fff,0 0 0 3px '+col : 'none'};`;
    sq.title = col;
    sq.addEventListener('click', () => {
      PC_COLORS[pc] = col;
      render(); buildNoteLegend(); closeColorPopup();
    });
    grid.appendChild(sq);
  }
  popup.appendChild(grid);

  // Hex input row
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:4px;align-items:center;';

  const preview = document.createElement('div');
  preview.style.cssText = `width:18px;height:18px;border-radius:3px;background:${PC_COLORS[pc]};flex-shrink:0;border:1px solid #556;`;

  const hexInp = document.createElement('input');
  hexInp.type = 'text'; hexInp.maxLength = 7; hexInp.spellcheck = false;
  hexInp.value = PC_COLORS[pc];
  hexInp.style.cssText = 'flex:1;font-size:11px;background:#101828;color:#dde;border:1px solid #3a4060;border-radius:3px;padding:2px 5px;min-width:0;';
  hexInp.addEventListener('input', () => {
    let v = hexInp.value.trim();
    if (!v.startsWith('#')) v = '#' + v;
    if (/^#[0-9a-fA-F]{6}$/i.test(v)) preview.style.background = v;
  });
  hexInp.addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key === 'Escape') { closeColorPopup(); return; }
    if (e.key === 'Enter') {
      let v = hexInp.value.trim();
      if (!v.startsWith('#')) v = '#' + v;
      if (/^#[0-9a-fA-F]{6}$/i.test(v)) {
        PC_COLORS[pc] = v.toLowerCase();
        render(); buildNoteLegend(); closeColorPopup();
      }
    }
  });

  const ok = document.createElement('button');
  ok.textContent = '✓';
  ok.style.cssText = 'background:#1f2547;color:#dde;border:1px solid #3a4060;border-radius:3px;padding:1px 7px;cursor:pointer;font-size:13px;';
  ok.addEventListener('click', () => {
    let v = hexInp.value.trim();
    if (!v.startsWith('#')) v = '#' + v;
    if (/^#[0-9a-fA-F]{6}$/i.test(v)) {
      PC_COLORS[pc] = v.toLowerCase();
      render(); buildNoteLegend(); closeColorPopup();
    }
  });

  row.appendChild(preview); row.appendChild(hexInp); row.appendChild(ok);
  popup.appendChild(row);

  // Position: right of anchor, clamped to viewport
  const rect = anchor.getBoundingClientRect();
  document.body.appendChild(popup);
  const pw = popup.offsetWidth, ph = popup.offsetHeight;
  popup.style.left = Math.min(rect.right + 6, window.innerWidth  - pw - 8) + 'px';
  popup.style.top  = Math.min(rect.top  - 4,  window.innerHeight - ph - 8) + 'px';

  _colorPopup = popup;
  setTimeout(() => document.addEventListener('click', closeColorPopup, { once: true }), 0);
  hexInp.focus(); hexInp.select();
}

function buildNoteLegend() {
  const pcs = new Map();
  for (const n of state.notes) {
    const pc = parsePitchClass(n.label);
    if (pc >= 0 && !pcs.has(pc)) pcs.set(pc, getDisplayNames()[pc]);
  }
  const sorted = [...pcs.entries()].sort((a, b) => a[0] - b[0]);
  const legend = document.getElementById('note-legend');
  legend.innerHTML = '';
  for (const [pc, name] of sorted) {
    const item = document.createElement('div');
    item.className = 'legend-item';

    const swatch = document.createElement('div');
    swatch.className = 'color-swatch';
    swatch.style.background = PC_COLORS[pc];
    swatch.title = `${name} — click to change color`;
    swatch.setAttribute('aria-label', `Change color for ${name}`);
    swatch.setAttribute('role', 'button');
    swatch.setAttribute('tabindex', '0');
    swatch.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showColorPopup(pc, swatch); } });
    swatch.addEventListener('click', e => { e.stopPropagation(); showColorPopup(pc, swatch); });

    const span = document.createElement('span');
    span.textContent = name;
    item.appendChild(swatch); item.appendChild(span);
    legend.appendChild(item);
  }
  if (hlMode === 'note') {
    document.getElementById('note-scale-table').innerHTML = buildScaleNativeTable(new Set(pcs.keys()));
  }
}

function buildScaleNativeTable(panPcs) {
  const COLS = ['Major', 'Minor', 'Dim'];
  const COL_LABELS = ['Maj', 'Min', 'Dim'];
  const roots = [...panPcs].sort((a, b) => a - b);

  const headerCells = COL_LABELS.map(l =>
    `<th style="text-align:center;color:#5b8db8;padding:2px 4px;font-size:10px;font-weight:bold;">${l}</th>`
  ).join('');

  const rows = roots.map(root => {
    const dotColor = PC_COLORS[root];
    const cells = COLS.map(type => {
      const ivs = CHORD_TYPES[type];
      const missing = ivs.map(i => (root + i) % 12).filter(p => !panPcs.has(p));
      if (missing.length === 0) {
        return `<td style="text-align:center;color:#5d8;padding:2px 3px;">✓</td>`;
      }
      const names = missing.map(p => getDisplayNames()[p]).join(',');
      return `<td style="text-align:center;color:#c44;padding:2px 3px;font-size:9px;" title="Missing: ${names}">–${names}</td>`;
    }).join('');
    return `<tr>
      <td style="padding:2px 4px;white-space:nowrap;">
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${dotColor};vertical-align:middle;margin-right:3px;"></span>
        <span style="font-size:11px;color:#ccd;vertical-align:middle;">${getDisplayNames()[root]}</span>
      </td>${cells}</tr>`;
  }).join('');

  return `<div style="margin-top:10px;">
    <div style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#5b8db8;margin-bottom:4px;">Main Chords</div>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <th style="text-align:left;color:#5b8db8;padding:2px 4px;font-size:10px;font-weight:bold;">Root</th>
        ${headerCells}
      </tr>
      ${rows}
    </table>
  </div>`;
}

function updateChordInfo() {
  const ivs    = CHORD_TYPES[hlChordType] || [];
  const panPcs = new Set(state.notes.map(n => parsePitchClass(n.label)).filter(p => p >= 0));
  const notes  = ivs.map(i => {
    const pc = (hlChordRoot + i) % 12;
    return { name: getDisplayNames()[pc], has: panPcs.has(pc) };
  });
  const all = notes.every(n => n.has);
  const isNative = all && panPcs.has(hlChordRoot);

  const noteHtml = notes.map(n =>
    `<span class="${n.has ? 'present' : 'missing'}">${n.name}${n.has ? '' : '✗'}</span>`
  ).join(' · ');
  const status = all ? '✓ All notes on pan' : `${notes.filter(n=>n.has).length}/${notes.length} notes on pan`;
  const nativeBadge = isNative
    ? `<span style="color:#5d8;font-size:10px;letter-spacing:.3px;">● Scale native</span>`
    : panPcs.has(hlChordRoot)
      ? `<span style="color:#a80;font-size:10px;letter-spacing:.3px;">◐ Root on pan, incomplete</span>`
      : `<span style="color:var(--fg-faint);font-size:10px;letter-spacing:.3px;">○ Root not on pan</span>`;

  const playHtml = `<button onclick="playChordAudio(_chordLabels(${hlChordRoot},'${hlChordType}'))" style="background:none;border:1px solid #445;color:#5b8db8;cursor:pointer;border-radius:3px;padding:1px 6px;font-size:11px;margin-left:6px;">♪ Play</button>`;

  document.getElementById('hl-chord-info').innerHTML =
    `${nativeBadge}<br>${noteHtml}<br><span style="color:${all?'#5d8':'#e05'}">${status}</span>${playHtml}`;
}

// ─── Chord-by-selection ──────────────────────────────────────────────────────

function identifyChord(pcs) {
  if (!pcs || pcs.size < 2) return [];
  const pcArr = [...pcs];
  const matches = [];
  for (const [typeName, ivs] of Object.entries(CHORD_TYPES)) {
    for (let root = 0; root < 12; root++) {
      const chordPcs = new Set(ivs.map(i => (root + i) % 12));
      if (pcArr.every(p => chordPcs.has(p)) && chordPcs.size === pcs.size) {
        const names = getDisplayNames();
        const sym = CHORD_SYMBOLS[typeName] ?? typeName;
        matches.push({ root, type: typeName, sym, name: `${names[root]} ${typeName}`, rootName: names[root] });
      }
    }
  }
  return matches;
}

// Returns the Set of pitch classes of currently selected notes, or null if empty.
function getSelectedPcs() {
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

// Returns true if the chord (rootPc, typeName) contains ALL pitch classes in selPcs.
function chordContainsSelPcs(rootPc, typeName, selPcs) {
  if (!selPcs || selPcs.size === 0) return true;
  const ivs = CHORD_TYPES[typeName];
  if (!ivs) return false;
  const chordPcs = new Set(ivs.map(i => (rootPc + i) % 12));
  for (const p of selPcs) { if (!chordPcs.has(p)) return false; }
  return true;
}

function getViableSelectionPcs() {
  if (hlMode !== 'selection' || selectedIds.size === 0) return null;
  const selectedPcs = new Set();
  for (const n of state.notes) {
    if (selectedIds.has(n.id)) {
      const pc = parsePitchClass(n.label);
      if (pc >= 0) selectedPcs.add(pc);
    }
  }
  if (selectedPcs.size === 0) return null;
  const viable = new Set(selectedPcs);
  const selArr = [...selectedPcs];
  for (let candidatePc = 0; candidatePc < 12; candidatePc++) {
    if (selectedPcs.has(candidatePc)) continue;
    for (const [, ivs] of Object.entries(CHORD_TYPES)) {
      let found = false;
      for (let root = 0; root < 12; root++) {
        const chordPcs = new Set(ivs.map(i => (root + i) % 12));
        if ([...selArr, candidatePc].every(p => chordPcs.has(p))) {
          viable.add(candidatePc);
          found = true; break;
        }
      }
      if (found) break;
    }
  }
  return viable;
}

function updateSelectionInfo() {
  const el = document.getElementById('hl-selection-info');
  if (!el) return;
  if (selectedIds.size === 0) {
    el.innerHTML = '<div class="t-hint" style="text-align:center;padding:8px 0;">Select notes on the pan to identify chords.<br>Shift+Click to multi-select.</div>';
    return;
  }
  const pcs = new Set();
  for (const n of state.notes) {
    if (selectedIds.has(n.id)) {
      const pc = parsePitchClass(n.label);
      if (pc >= 0) pcs.add(pc);
    }
  }
  const names = getDisplayNames();
  const noteNames = [...pcs].map(pc =>
    `<span style="display:inline-flex;align-items:center;gap:3px;"><span style="width:8px;height:8px;border-radius:50%;background:${PC_COLORS[pc]};display:inline-block;"></span>${names[pc]}</span>`
  ).join(' &nbsp; ');

  const chords = identifyChord(pcs);

  let html = `<div style="margin-bottom:6px;">${noteNames}</div>`;

  if (pcs.size < 2) {
    html += '<div class="t-hint">Select more notes to identify a chord</div>';
  } else if (chords.length === 0) {
    html += '<div style="color:#e05;font-size:12px;">No matching chord</div>';
  } else {
    // Show chords as prominent tiles
    html += '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;">';
    for (const c of chords) {
      const panPcs = new Set(state.notes.map(n => parsePitchClass(n.label)).filter(p => p >= 0));
      const ivs = CHORD_TYPES[c.type];
      const chordNotes = ivs.map(i => {
        const pc = (c.root + i) % 12;
        return { name: names[pc], has: panPcs.has(pc) };
      });
      const all = chordNotes.every(n => n.has);
      const dotColor = all ? '#44cc88' : '#cc8800';
      const dotChar = all ? '●' : '◕';
      const chordNoteStr = chordNotes.map(n =>
        `<span style="color:${n.has ? '#aab' : '#e05'}">${n.name}${n.has ? '' : '✗'}</span>`
      ).join(' · ');

      html += `<div style="background:#1c1c35;border:1px solid #3a4060;border-radius:6px;padding:8px 12px;cursor:pointer;flex:1;min-width:100px;text-align:center;" onclick="playChordAudio(_chordLabels(${c.root},'${c.type}'))">` +
        `<div style="font-size:18px;font-weight:bold;color:#ccd;line-height:1.2;">${c.rootName}<span style="font-size:12px;color:#7ab;margin-left:2px;">${c.sym}</span></div>` +
        `<div style="font-size:10px;color:var(--fg-faint);margin-top:2px;">${c.type}</div>` +
        `<div style="font-size:10px;margin-top:4px;">${chordNoteStr}</div>` +
        `<div style="font-size:9px;color:${dotColor};margin-top:2px;">${dotChar} ${all ? 'All on pan' : 'Partial'}</div>` +
        `<div style="font-size:9px;color:#5b8db8;margin-top:3px;">click to play</div>` +
        `</div>`;
    }
    html += '</div>';
  }

  el.innerHTML = html;

  // Keep the explore chord/prog list in sync with the selection
  if (appMode === 'explore') {
    if (exploreTab === 'chords') renderChords();
    else renderProgressions();
  }
}

// ─── Pan name input ────────────────────────────────────────────────────────────

(function () {
  const panNameEl = document.getElementById('pan-name');
  if (!panNameEl) return;
  panNameEl.addEventListener('input', e => { state.pan.name = e.target.value; });
  panNameEl.addEventListener('change', () => pushHistory());
})();

// ─── Inline label editor ──────────────────────────────────────────────────────

function startInlineLabelEdit(note) {
  document.getElementById('note-label-inp')?.remove();
  const svgRect = document.getElementById('canvas').getBoundingClientRect();
  const sx = svgRect.width / 1000, sy = svgRect.height / 1400;
  const sc = Math.min(sx, sy);
  const cx = svgRect.left + note.x * sx;
  const cy = svgRect.top  + note.y * sy;
  const diam = Math.round(note.r * 2 * sc);
  const fs   = Math.max(9, Math.min(Math.round(note.r * 0.46 * sc), 22));

  const inp = document.createElement('input');
  inp.id = 'note-label-inp'; inp.className = 'note-label-inp';
  inp.type = 'text'; inp.value = note.label; inp.maxLength = 8;
  Object.assign(inp.style, {
    left: (cx - note.r * sc) + 'px', top: (cy - note.r * sc) + 'px',
    width: diam + 'px', height: diam + 'px',
    fontSize: fs + 'px', lineHeight: diam + 'px',
  });
  document.body.appendChild(inp);
  inp.focus(); inp.select();

  const origLabel = note.label;
  const finish = () => {
    if (!document.body.contains(inp)) return;
    const val = inp.value.trim() || origLabel;
    note.label = (enharmonicMode !== '-') ? rewriteLabel(val) : val;
    document.body.removeChild(inp);
    // Move noteNumber from old label key to new label key
    if (state.noteNumbers && note.label !== origLabel && origLabel in state.noteNumbers) {
      state.noteNumbers[note.label] = state.noteNumbers[origLabel];
      if (!state.notes.some(n => n !== note && n.label === origLabel)) delete state.noteNumbers[origLabel];
    }
    const pl = document.getElementById('prop-label');
    if (pl) pl.value = note.label;
    render(); updateHighlightPanel(); pushHistory();
  };
  inp.addEventListener('blur', finish);
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter')  { inp.blur(); e.preventDefault(); }
    if (e.key === 'Escape') { inp.value = origLabel; inp.blur(); }
    e.stopPropagation();
  });
  inp.addEventListener('input', () => { note.label = inp.value; renderNotes(); });
}

function startInlineNumberEdit(note) {
  document.getElementById('note-num-inp')?.remove();
  const svgRect = document.getElementById('canvas').getBoundingClientRect();
  const sx = svgRect.width / 1000, sy = svgRect.height / 1400;
  const sc = Math.min(sx, sy);
  const cx = svgRect.left + note.x * sx;
  const cy = svgRect.top  + (note.y + note.r * 0.45) * sy;
  const fs = Math.max(8, Math.min(Math.round(note.r * 0.46 * 0.7 * sc), 16));
  const w  = Math.round(note.r * 1.2 * sc);
  const h  = Math.round(fs * 2.2);

  const inp = document.createElement('input');
  inp.id = 'note-num-inp'; inp.className = 'note-label-inp';
  inp.type = 'number'; inp.min = 0; inp.max = 999; inp.step = 1;
  inp.value = (state.noteNumbers && state.noteNumbers[note.label] != null) ? state.noteNumbers[note.label] : '';
  Object.assign(inp.style, {
    left: (cx - w / 2) + 'px', top: (cy - h / 2) + 'px',
    width: w + 'px', height: h + 'px',
    fontSize: fs + 'px', lineHeight: h + 'px',
  });
  document.body.appendChild(inp);
  inp.focus(); inp.select();

  const origVal = inp.value;
  const finish = () => {
    if (!document.body.contains(inp)) return;
    const raw = inp.value.trim();
    if (!state.noteNumbers) state.noteNumbers = {};
    if (raw === '') {
      delete state.noteNumbers[note.label];
    } else {
      const num = parseInt(raw, 10);
      // Duplicate guard: reject if another label already uses this number
      const dup = Object.entries(state.noteNumbers).find(([lbl, v]) => v === num && lbl !== note.label);
      if (dup) {
        // Reset to original value — don't apply
        document.body.removeChild(inp);
        render(); syncSidebar();
        return;
      }
      state.noteNumbers[note.label] = num;
    }
    document.body.removeChild(inp);
    const propNum = document.getElementById('prop-num');
    if (propNum) propNum.value = (state.noteNumbers[note.label] != null) ? state.noteNumbers[note.label] : '';
    pushHistory(); render(); syncSidebar();
    _syncHatNotes();
  };
  inp.addEventListener('blur', finish);
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter')  { inp.blur(); e.preventDefault(); }
    if (e.key === 'Escape') { inp.value = origVal; inp.blur(); }
    e.stopPropagation();
  });
}

