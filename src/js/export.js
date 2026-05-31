// ─── SVG / PNG export helpers ─────────────────────────────────────────────────

function buildSVGString(highlightPcs = null, chordLabel = '') {
  const { cx, cy, r } = state.pan;
  const innerR = Math.max(r - 50, Math.round(r * 0.8));
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1400" viewBox="0 0 1000 1400">
<rect width="1000" height="1400" fill="white"/>
<circle cx="${cx}" cy="${cy}" r="${r}" fill="#f2f2f2" stroke="#c0c0c0" stroke-width="5"/>
<circle cx="${cx}" cy="${cy}" r="${innerR}" fill="none" stroke="#e0e0e0" stroke-width="1.5"/>`;

  for (const note of state.notes) {
    const pc = parsePitchClass(note.label);
    let stroke = ACCENT, strokeW = 2.5, opacity = 1, fill = 'white';

    if (highlightPcs === 'all') {
      stroke = pc >= 0 ? PC_COLORS[pc] : ACCENT; strokeW = 5;
    } else if (highlightPcs instanceof Set) {
      if (highlightPcs.has(pc)) { stroke = pc >= 0 ? PC_COLORS[pc] : ACCENT; strokeW = 6; }
      else                      { stroke = '#ccc'; strokeW = 2; opacity = 0.3; }
    }

    const fs  = Math.max(10, Math.min(Math.round(note.r * 0.46), 22));
    const lbl = fmtLabel(note.label);
    const hasNum = showNoteNumbers && state.noteNumbers && state.noteNumbers[note.label] != null;
    const swapped = hasNum && focusNumbers;
    let centerText, subText = '';
    if (swapped) {
      centerText = `<text x="${note.x}" y="${note.y}" text-anchor="middle" dominant-baseline="central" ` +
                   `font-family="Arial, sans-serif" font-size="${fs}" fill="#222">${state.noteNumbers[note.label]}</text>`;
      const nfs = Math.max(8, Math.round(fs * 0.7));
      subText = `<text x="${note.x}" y="${note.y + note.r * 0.45}" text-anchor="middle" dominant-baseline="central" ` +
                `font-family="Arial, sans-serif" font-size="${nfs}" fill="#666">${lbl}</text>`;
    } else {
      centerText = `<text x="${note.x}" y="${note.y}" text-anchor="middle" dominant-baseline="central" ` +
                   `font-family="Arial, sans-serif" font-size="${fs}" fill="#222">${lbl}</text>`;
      if (hasNum) {
        const nfs = Math.max(8, Math.round(fs * 0.7));
        subText = `<text x="${note.x}" y="${note.y + note.r * 0.45}" text-anchor="middle" dominant-baseline="central" ` +
                  `font-family="Arial, sans-serif" font-size="${nfs}" fill="#666">${state.noteNumbers[note.label]}</text>`;
      }
    }
    s += `\n<g opacity="${opacity}">` +
         `<circle cx="${note.x}" cy="${note.y}" r="${note.r}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}"/>` +
         `${centerText}${subText}</g>`;
  }

  if (chordLabel) {
    s += `\n<text x="500" y="880" text-anchor="middle" font-family="Arial, sans-serif" ` +
         `font-size="30" font-weight="bold" fill="#333">${fmtLabel(chordLabel)}</text>`;
  }

  s += '\n</svg>';
  return s;
}

function svgToPngBlob(svgStr) {
  return svgToPngBlobSized(svgStr, 1000, 1400);
}

function svgToPngBlobSized(svgStr, w, h) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const img  = new Image();
    img.onload = () => {
      const canvas = Object.assign(document.createElement('canvas'), { width: w, height: h });
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob(resolve, 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('SVG render failed')); };
    img.src = url;
  });
}

function dlBlob(blob, name) {
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob), download: name });
  a.click(); URL.revokeObjectURL(a.href);
}

// ─── Panel collapse helpers ────────────────────────────────────────────────────

function togglePanel(el) {
  (el.classList.contains('panel') ? el : el.closest('.panel')).classList.toggle('collapsed');
}


// ─── Export functions ─────────────────────────────────────────────────────────

function exportJSON() {
  const { cx, cy, r } = state.pan;
  dlBlob(new Blob([JSON.stringify({
    version: 1,
    name: state.pan.name || '',
    pan: { cx, cy, r },
    notes: state.notes,
    noteNumbers: state.noteNumbers || {},
  }, null, 2)], { type:'application/json' }), 'handpan-layout.json');
}

function triggerImport() { document.getElementById('file-input').click(); }

document.getElementById('file-input').addEventListener('change', e => {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const d = JSON.parse(ev.target.result);
      if (d.pan)   { state.pan = d.pan; if (typeof d.name === 'string') state.pan.name = d.name; }
      if (d.notes) {
        state.notes = d.notes.map(n => ({ ...n, label: n.label || '' }));
        state.nextId = 1;
        for (const n of state.notes) {
          const num = parseInt(n.id.replace(/\D/g,''));
          if (!isNaN(num) && num >= state.nextId) state.nextId = num + 1;
        }
      }
      state.noteNumbers = d.noteNumbers || generateNoteNumbers(state.notes);
      if (enharmonicMode !== '-') applyEnharmonics();
      const panNameEl = document.getElementById('pan-name');
      if (panNameEl) panNameEl.value = state.pan.name || '';
      selectedIds.clear(); pushHistory(); render(); syncSidebar(); syncPanSlider();
    } catch (err) { alert('Invalid JSON: ' + err.message); }
  };
  reader.readAsText(file); e.target.value = '';
});

function exportCurrentSVG() {
  const hpcs = getHighlightedPcs();
  const label = hlMode === 'chord' ? `${CHORD_SYMBOLS[hlChordType] ?? ''} ${getDisplayNames()[hlChordRoot]} ${hlChordType}` : '';
  dlBlob(new Blob([buildSVGString(hpcs, label)], { type:'image/svg+xml' }), 'handpan-layout.svg');
}

function exportCurrentPNG() {
  const hpcs  = getHighlightedPcs();
  const label = hlMode === 'chord' ? `${CHORD_SYMBOLS[hlChordType] ?? ''} ${getDisplayNames()[hlChordRoot]} ${hlChordType}` : '';
  svgToPngBlob(buildSVGString(hpcs, label)).then(blob => dlBlob(blob, 'handpan-layout.png'));
}

// All 12 roots × types; native=true when fully playable (all tones on pan).
// Partial chords (some notes missing) are included in "All" export only.
function getAllChords(types) {
  const panPcs = new Set(state.notes.map(n => parsePitchClass(n.label)).filter(p => p >= 0));
  const result = [];
  for (const type of types) {
    const ivs = CHORD_TYPES[type]; if (!ivs) continue;
    for (let root = 0; root < 12; root++) {
      const pcs     = ivs.map(i => (root + i) % 12);
      const missing = pcs.filter(p => !panPcs.has(p));
      const play    = missing.length === 0           ? 'complete'
                    : missing.length === 1           ? 'partial'
                    : missing.length < pcs.length    ? 'incomplete'
                    :                                  'none';
      const native     = play === 'complete';
      const missingStr = missing.map(p => getDisplayNames()[p]).join(', ');
      const label = native
        ? `${CHORD_SYMBOLS[type] ?? ''} ${getDisplayNames()[root]} ${type}`
        : `${CHORD_SYMBOLS[type] ?? ''} ${getDisplayNames()[root]} ${type} (−${missingStr})`;
      result.push({ type, root, pcs: new Set(pcs), play, native, label,
        filename: `${ROOT_FILE[root]}_${type}.png` });
    }
  }
  return result;
}

// Only fully playable chords (used for chord info panel).
function getPlayableChords(types) {
  return getAllChords(types).filter(c => c.native);
}

function showToast(msg, ms = 3500, type) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.toggle('warn', type === 'warn');
  el.classList.add('visible');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('visible'), ms);
}

function setExportStatus(msg) {
  document.getElementById('export-status').textContent = msg;
  if (msg.startsWith('Done')) showToast(msg);
}

async function exportAllChordsZip() {
  if (typeof JSZip === 'undefined') {
    alert('JSZip not loaded — check internet connection.'); return;
  }
  const types = getSelectedChordTypes();
  if (!types.length) { setExportStatus('No chord types selected.'); return; }

  const wantPlay = new Set([
    document.getElementById('export-play-complete').checked  && 'complete',
    document.getElementById('export-play-partial').checked   && 'partial',
    document.getElementById('export-play-incomplete').checked && 'incomplete',
    document.getElementById('export-play-none').checked      && 'none',
  ].filter(Boolean));

  if (!wantPlay.size) { setExportStatus('No completeness level selected.'); return; }

  const toExport = getAllChords(types).filter(c => wantPlay.has(c.play));

  if (!toExport.length) {
    setExportStatus('No matching chords found.');
    return;
  }

  setExportStatus(`0 / ${toExport.length} …`);
  const zip = new JSZip();

  // Folder per play level → per type
  const folderName = { complete: 'Complete', partial: 'Partial (−1)', incomplete: 'Incomplete (−2+)', none: 'None' };

  for (let i = 0; i < toExport.length; i++) {
    const c = toExport[i];
    setExportStatus(`${i+1} / ${toExport.length}  ${c.label}`);
    const svg = buildSVGString(c.pcs, c.label);
    const png = await svgToPngBlob(svg);
    zip.folder(`${folderName[c.play]}/${c.type}`).file(c.filename, png);
  }

  setExportStatus('Building ZIP …');
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  dlBlob(zipBlob, 'handpan-chords.zip');
  setExportStatus(`Done — ${toExport.length} chord images exported.`);
  setTimeout(() => setExportStatus(''), 5000);
}

