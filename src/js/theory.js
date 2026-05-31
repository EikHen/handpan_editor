// ─── Pitch class helpers ──────────────────────────────────────────────────────

function parsePitchClass(label) {
  if (!label) return -1;
  const m = label.match(/^([A-G])([#♯b♭]?)/i);
  if (!m) return -1;
  const base = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 }[m[1].toUpperCase()];
  if (base === undefined) return -1;
  const acc = (m[2] === '#' || m[2] === '♯') ? 1 : (m[2] === 'b' || m[2] === '♭') ? -1 : 0;
  return (base + acc + 12) % 12;
}

function fmtLabel(s) {
  return (s || '').replace(/#/g, '♯').replace(/b(?=[0-9])/g, '♭');
}

// ─── Enharmonic helpers ───────────────────────────────────────────────────────

function getDisplayNames() {
  if (enharmonicMode === '#') return SHARP_NAMES;
  if (enharmonicMode === 'b') return FLAT_NAMES;
  if (enharmonicMode === 'proper') {
    const panPcs = new Set(state.notes.map(n => parsePitchClass(n.label)).filter(p => p >= 0));
    let best = null, bestScore = -1;
    for (const key of MAJOR_KEYS) {
      let score = 0;
      for (const pc of panPcs) if (key.pcs.has(pc)) score++;
      if (score > bestScore) { bestScore = score; best = key; }
    }
    if (!best || best.acc === '') return PC_NAMES;
    return best.acc === '#' ? SHARP_NAMES : FLAT_NAMES;
  }
  // '-' default: derive from user's note labels
  const userNames = [...PC_NAMES];
  for (const n of state.notes) {
    const pc = parsePitchClass(n.label);
    if (pc < 0) continue;
    const m = n.label.match(/^([A-G][#♯b♭]?)/i);
    if (m) userNames[pc] = fmtLabel(m[1]);
  }
  return userNames;
}

function rewriteLabel(label) {
  if (!label) return label;
  const pc = parsePitchClass(label);
  if (pc < 0) return label;
  const names = getDisplayNames();
  const newPitch = names[pc];
  const m = label.match(/(\d+)$/);
  return newPitch + (m ? m[1] : '');
}

function applyEnharmonics() {
  for (const n of state.notes) n.label = rewriteLabel(n.label);
}

// ─── MIDI helpers ─────────────────────────────────────────────────────────────

// Convert a note label (e.g. "F#3", "Bb2") to a MIDI note number.
function midiNote(label) {
  const m = label.match(/^([A-G])([#♯b♭]?)(\d+)$/i);
  if (!m) return 60;
  const base = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 }[m[1].toUpperCase()] ?? 0;
  const acc  = (m[2] === '#' || m[2] === '♯') ? 1 : (m[2] === 'b' || m[2] === '♭') ? -1 : 0;
  return (parseInt(m[3]) + 1) * 12 + base + acc;
}
