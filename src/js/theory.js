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

// ─── Layout-from-string ───────────────────────────────────────────────────────

// Convert a note label (e.g. "F#3", "Bb2") to a MIDI note number.
function midiNote(label) {
  const m = label.match(/^([A-G])([#♯b♭]?)(\d+)$/i);
  if (!m) return 60;
  const base = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 }[m[1].toUpperCase()] ?? 0;
  const acc  = (m[2] === '#' || m[2] === '♯') ? 1 : (m[2] === 'b' || m[2] === '♭') ? -1 : 0;
  return (parseInt(m[3]) + 1) * 12 + base + acc;
}

// Map MIDI pitch to a circle radius: lower pitch → larger circle.
function pitchRadius(label, minR, maxR, midiLo = 44, midiHi = 84) {
  const t = Math.max(0, Math.min(1, (midiNote(label) - midiLo) / (midiHi - midiLo)));
  return Math.round(maxR - t * (maxR - minR));
}

function layoutFromString(s) {
  const tokens = s.split(',').map(t => t.trim()).filter(Boolean);
  let ding = null, ring = [], mutants = [], bottom = [];
  for (const t of tokens) {
    if      (t.startsWith('~')) bottom.push(t.slice(1));
    else if (t.startsWith('*')) mutants.push(t.slice(1));
    else if (ding === null)     ding = t;
    else                        ring.push(t);
  }

  const cx = 500, cy = 500;
  const ringOrbit   = 210;
  const mutantOrbit = 128;
  const bottomOrbit = 400;

  // Correct handpan zigzag: bottom → bottom-LEFT → bottom-RIGHT → mid-LEFT → …
  // (SVG: y-axis points down, so larger angle = left side)
  function ringAngles(n) {
    if (n === 0) return [];
    const step = 2 * Math.PI / n;
    return Array.from({ length: n }, (_, i) =>
      Math.PI / 2 - ((-1) ** i) * Math.ceil(i / 2) * step
    );
  }

  function mutantAngles(nRing, nMutants) {
    if (nMutants === 0) return [];
    if (nRing === 0) {
      const step = 2 * Math.PI / Math.max(nMutants, 1);
      return Array.from({ length: nMutants }, (_, i) => (3 * Math.PI / 2 + i * step) % (2 * Math.PI));
    }
    const step = 2 * Math.PI / nRing;
    const gaps = Array.from({ length: nRing }, (_, k) =>
      (Math.PI / 2 + (k + 0.5) * step) % (2 * Math.PI)
    );
    const top = 3 * Math.PI / 2;
    const angDist = a => { const d = Math.abs(a - top) % (2 * Math.PI); return Math.min(d, 2 * Math.PI - d); };
    gaps.sort((a, b) => {
      const da = angDist(a), db = angDist(b);
      if (Math.abs(da - db) > 1e-9) return da - db;
      return (a > top ? 0 : 1) - (b > top ? 0 : 1);
    });
    return gaps.slice(0, nMutants);
  }

  function bottomAngles(n) {
    if (n === 0) return [];
    const start = Math.PI / 3;
    const step  = 2 * Math.PI / n;
    return Array.from({ length: n }, (_, i) => (start - i * step + 4 * Math.PI) % (2 * Math.PI));
  }

  const notes = [];
  let id = 1;

  if (ding) notes.push({ id: `n${id++}`, x: cx, y: cy, r: 80, label: ding });

  ringAngles(ring.length).forEach((a, i) => {
    notes.push({ id: `n${id++}`,
      x: Math.round(cx + ringOrbit * Math.cos(a)),
      y: Math.round(cy + ringOrbit * Math.sin(a)),
      r: pitchRadius(ring[i], 38, 62), label: ring[i] });
  });

  mutantAngles(ring.length, mutants.length).forEach((a, i) => {
    notes.push({ id: `n${id++}`,
      x: Math.round(cx + mutantOrbit * Math.cos(a)),
      y: Math.round(cy + mutantOrbit * Math.sin(a)),
      r: pitchRadius(mutants[i], 24, 36), label: mutants[i] });
  });

  bottomAngles(bottom.length).forEach((a, i) => {
    notes.push({ id: `n${id++}`,
      x: Math.round(cx + bottomOrbit * Math.cos(a)),
      y: Math.round(cy + bottomOrbit * Math.sin(a)),
      r: pitchRadius(bottom[i], 40, 72), label: bottom[i] });
  });

  return { pan: { cx, cy, r: 320 }, notes, nextId: id };
}

