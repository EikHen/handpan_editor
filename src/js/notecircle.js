/**
 * notecircle.js — Note Circle visualization: chromatic/fifths circle, polygon shapes, click handling
 *
 * Globals exported: renderNoteCircle, toggleNoteCircle, populateTopNoteDropdown,
 *                   updateCircleSelectionInfo
 * Depends on:       state.js, render.js, theory.js, constants.js, interaction.js, audio.js
 * Used by:          render.js, interaction.js, ui.js
 */

// ─── Constants ───────────────────────────────────────────────────────────────

const CHROMATIC_ORDER = [0,1,2,3,4,5,6,7,8,9,10,11];
const FIFTHS_ORDER    = [0,7,2,9,4,11,6,1,8,3,10,5];

const _NC_CX = 500, _NC_CY = 480, _NC_R = 300, _NC_DOT_R = 38;

// ─── Position helpers ────────────────────────────────────────────────────────

function _getCircleOrder() {
  return noteCircleOrder === 'fifths' ? FIFTHS_ORDER : CHROMATIC_ORDER;
}

function getCircleNotePositions() {
  const order = _getCircleOrder();
  const topIdx = order.indexOf(noteCircleTopPc);
  const positions = [];
  for (let i = 0; i < 12; i++) {
    const idx = (topIdx + i) % 12;
    const pc = order[idx];
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2; // start at top
    positions.push({
      pc,
      x: _NC_CX + _NC_R * Math.cos(angle),
      y: _NC_CY + _NC_R * Math.sin(angle),
    });
  }
  return positions;
}

// ─── Polygon drawing ─────────────────────────────────────────────────────────

function _drawChordPolygon(pcs, positions, color, opacity) {
  if (!pcs || pcs.size < 2) return null;
  const pts = positions.filter(p => pcs.has(p.pc));
  if (pts.length < 2) return null;
  const pointsStr = pts.map(p => `${p.x},${p.y}`).join(' ');
  const poly = svgEl('polygon', {
    points: pointsStr,
    fill: color,
    'fill-opacity': opacity,
    stroke: color,
    'stroke-opacity': Math.min(1, opacity * 5),
    'stroke-width': 2,
    'pointer-events': 'none',
  });
  return poly;
}

// ─── Render ──────────────────────────────────────────────────────────────────

function renderNoteCircle() {
  panLayer.innerHTML = '';
  notesLayer.innerHTML = '';

  const positions = getCircleNotePositions();
  const panPcs = new Set(state.notes.map(n => parsePitchClass(n.label)).filter(p => p >= 0));
  const names = getDisplayNames();

  // 1. Guide ring
  panLayer.appendChild(svgEl('circle', {
    cx: _NC_CX, cy: _NC_CY, r: _NC_R,
    fill: 'none', stroke: '#e0e0e0', 'stroke-width': 1.5,
    'pointer-events': 'none',
  }));

  // 2. Chord/selection polygon
  const hpcs = getHighlightedPcs();
  if (hpcs && hpcs !== 'all' && hpcs.size >= 2) {
    let polyColor = ACCENT;
    if (hlMode === 'chord') {
      polyColor = PC_COLORS[hlChordRoot] || ACCENT;
    }
    const poly = _drawChordPolygon(hpcs, positions, polyColor, 0.12);
    if (poly) panLayer.appendChild(poly);
  }

  // Circle-selection polygon (when in selection mode with circle-selected PCs)
  if (hlMode === 'selection' && circleSelectedPcs.size >= 2) {
    const poly = _drawChordPolygon(circleSelectedPcs, positions, ACCENT, 0.12);
    if (poly) panLayer.appendChild(poly);
  }

  // 3. Note circles
  for (const pos of positions) {
    const onPan = panPcs.has(pos.pc);
    const isHighlighted = hpcs && hpcs !== 'all' && hpcs.has(pos.pc);
    const isAllHighlight = hpcs === 'all';
    const isCircleSelected = hlMode === 'selection' && circleSelectedPcs.has(pos.pc);

    let strokeColor = onPan ? '#333' : '#ccc';
    let strokeW = 2;
    let textColor = onPan ? '#222' : '#aaa';
    let noteOpacity = onPan ? 1 : 0.35;

    if (isCircleSelected) {
      strokeColor = '#f90';
      strokeW = 3.5;
      noteOpacity = 1;
    } else if (isHighlighted || isAllHighlight) {
      strokeColor = PC_COLORS[pos.pc] || ACCENT;
      strokeW = onPan ? 5 : 3;
      noteOpacity = 1;
    }

    const g = svgEl('g', {
      'data-pc': pos.pc,
      cursor: 'pointer',
      opacity: noteOpacity,
      class: 'circle-note' + (!onPan ? ' unavailable' : ''),
    });

    g.appendChild(svgEl('circle', {
      cx: pos.x, cy: pos.y, r: _NC_DOT_R,
      fill: 'white', stroke: strokeColor, 'stroke-width': strokeW,
    }));

    const txt = svgEl('text', {
      x: pos.x, y: pos.y,
      'text-anchor': 'middle', 'dominant-baseline': 'central',
      'font-family': 'Arial, sans-serif',
      'font-size': onPan ? 16 : 14,
      'font-weight': onPan ? 'bold' : 'normal',
      fill: textColor, 'pointer-events': 'none',
    });
    txt.textContent = names[pos.pc];
    g.appendChild(txt);

    g.addEventListener('mousedown', _onCircleNoteClick);
    notesLayer.appendChild(g);
  }

  // 4. Chord label below circle
  if (hlMode === 'chord') {
    const lbl = svgEl('text', {
      x: _NC_CX, y: _NC_CY + _NC_R + 70,
      'text-anchor': 'middle', 'dominant-baseline': 'middle',
      'font-family': 'Arial, sans-serif', 'font-size': 30,
      'font-weight': 'bold', fill: '#333', 'pointer-events': 'none',
    });
    lbl.textContent = `${CHORD_SYMBOLS[hlChordType] ?? ''} ${names[hlChordRoot]} ${hlChordType}`;
    notesLayer.appendChild(lbl);
  }
}

// ─── Click handling ──────────────────────────────────────────────────────────

function _onCircleNoteClick(e) {
  e.stopPropagation();
  const pc = parseInt(e.currentTarget.getAttribute('data-pc'));
  if (isNaN(pc)) return;

  if (hlMode === 'selection') {
    // Toggle PC in circleSelectedPcs
    if (circleSelectedPcs.has(pc)) {
      circleSelectedPcs.delete(pc);
    } else {
      circleSelectedPcs.add(pc);
    }
    render();
    updateCircleSelectionInfo();
    return;
  }

  // Other modes: play the note if it's on the pan
  const note = state.notes.find(n => parsePitchClass(n.label) === pc);
  if (note) playNote(note.label);
}

// ─── Selection info ──────────────────────────────────────────────────────────

function updateCircleSelectionInfo() {
  const el = document.getElementById('hl-selection-info');
  if (!el) return;

  if (circleSelectedPcs.size === 0) {
    el.innerHTML = '<div class="t-hint" style="text-align:center;padding:8px 0;">Click notes on the circle to identify chords.<br>Click again to deselect.</div>';
    return;
  }

  const names = getDisplayNames();
  const noteNames = [...circleSelectedPcs].map(pc =>
    `<span style="display:inline-flex;align-items:center;gap:3px;"><span style="width:8px;height:8px;border-radius:50%;background:${PC_COLORS[pc]};display:inline-block;"></span>${names[pc]}</span>`
  ).join(' &nbsp; ');

  const chords = identifyChord(circleSelectedPcs);

  let html = `<div style="margin-bottom:6px;">${noteNames}</div>`;

  if (circleSelectedPcs.size < 2) {
    html += '<div class="t-hint">Select more notes to identify a chord</div>';
  } else if (chords.length === 0) {
    html += '<div style="color:#e05;font-size:12px;">No matching chord</div>';
  } else {
    const panPcs = new Set(state.notes.map(n => parsePitchClass(n.label)).filter(p => p >= 0));
    html += '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;">';
    for (const c of chords) {
      const ivs = CHORD_TYPES[c.type];
      const chordNotes = ivs.map(i => {
        const cpc = (c.root + i) % 12;
        return { name: names[cpc], has: panPcs.has(cpc) };
      });
      const all = chordNotes.every(n => n.has);
      const dotColor = all ? '#44cc88' : '#cc8800';
      const dotChar = all ? '\u25CF' : '\u25D5';
      const chordNoteStr = chordNotes.map(n =>
        `<span style="color:${n.has ? '#aab' : '#e05'}">${n.name}${n.has ? '' : '\u2717'}</span>`
      ).join(' \u00B7 ');

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

  if (appMode === 'explore') {
    if (exploreTab === 'chords') renderChords();
    else renderProgressions();
  }
}

// ─── SVG string export (mirrors buildSVGString but draws the note circle) ───

function buildNoteCircleSVGString(highlightPcs = null, chordLabel = '') {
  const CX = 500, CY = 480, R = 300, DOT_R = 38;
  const W = 1000, H = 1000;
  const positions = _getCircleNotePositions(CX, CY, R);
  const panPcs = new Set(state.notes.map(n => parsePitchClass(n.label)).filter(p => p >= 0));
  const names = getDisplayNames();

  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="white"/>
<circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="#e0e0e0" stroke-width="1.5"/>`;

  // Chord polygon
  if (highlightPcs && highlightPcs !== 'all' && highlightPcs.size >= 2) {
    const pts = positions.filter(p => highlightPcs.has(p.pc));
    if (pts.length >= 2) {
      const polyColor = (hlMode === 'chord' && PC_COLORS[hlChordRoot]) || ACCENT;
      s += `\n<polygon points="${pts.map(p => `${p.x},${p.y}`).join(' ')}" ` +
           `fill="${polyColor}" fill-opacity="0.12" stroke="${polyColor}" stroke-opacity="0.6" stroke-width="2"/>`;
    }
  }

  // Note dots
  for (const pos of positions) {
    const onPan = panPcs.has(pos.pc);
    const isHighlighted = highlightPcs && highlightPcs !== 'all' && highlightPcs.has(pos.pc);
    const isAllHighlight = highlightPcs === 'all';

    let strokeColor = onPan ? '#333' : '#ccc';
    let strokeW = 2;
    let textColor = onPan ? '#222' : '#aaa';
    let noteOpacity = onPan ? 1 : 0.35;

    if (isHighlighted || isAllHighlight) {
      strokeColor = PC_COLORS[pos.pc] || ACCENT;
      strokeW = onPan ? 5 : 3;
      noteOpacity = 1;
    }

    const fs = onPan ? 16 : 14;
    const fw = onPan ? 'bold' : 'normal';
    s += `\n<g opacity="${noteOpacity}">` +
         `<circle cx="${pos.x}" cy="${pos.y}" r="${DOT_R}" fill="white" stroke="${strokeColor}" stroke-width="${strokeW}"/>` +
         `<text x="${pos.x}" y="${pos.y}" text-anchor="middle" dominant-baseline="central" ` +
         `font-family="Arial, sans-serif" font-size="${fs}" font-weight="${fw}" fill="${textColor}">${names[pos.pc]}</text></g>`;
  }

  if (chordLabel) {
    s += `\n<text x="${CX}" y="${CY + R + 70}" text-anchor="middle" font-family="Arial, sans-serif" ` +
         `font-size="30" font-weight="bold" fill="#333">${fmtLabel(chordLabel)}</text>`;
  }

  s += '\n</svg>';
  return s;
}

// Position helper that accepts custom center/radius (for SVG export)
function _getCircleNotePositions(cx, cy, r) {
  const order = _getCircleOrder();
  const topIdx = order.indexOf(noteCircleTopPc);
  const positions = [];
  for (let i = 0; i < 12; i++) {
    const idx = (topIdx + i) % 12;
    const pc = order[idx];
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
    positions.push({ pc, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
  }
  return positions;
}

// ─── UI helpers ──────────────────────────────────────────────────────────────

function toggleNoteCircle(active) {
  noteCircleActive = active;
  const optsEl = document.getElementById('note-circle-opts');
  if (optsEl) optsEl.style.display = active ? '' : 'none';
  if (!active) circleSelectedPcs.clear();
  render();
  saveSettings();
}

function populateTopNoteDropdown() {
  const sel = document.getElementById('note-circle-top');
  if (!sel) return;
  const names = getDisplayNames();
  sel.innerHTML = '';
  for (let pc = 0; pc < 12; pc++) {
    const o = document.createElement('option');
    o.value = pc;
    o.textContent = names[pc];
    sel.appendChild(o);
  }
  sel.value = noteCircleTopPc;
}
