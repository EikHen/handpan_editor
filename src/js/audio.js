// ─── Audio preview (re-added; accidentally removed in M6) ─────────────────────

let audioPreviewVol     = 0.6;  // 0–1
let audioPreviewSustain = 1.4;  // seconds
let _audioCtx = null;

function ensureAudioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Play a single handpan note: sine harmonics with metallic decay envelope.
function playNote(label, when = 0, vol = null) {
  try {
    const ctx = ensureAudioCtx();
    const freq = midiToFreq(midiNote(label));
    const g = vol !== null ? vol : audioPreviewVol;
    const t = ctx.currentTime + when;
    const sus = audioPreviewSustain;
    for (const [h, hg] of [[1, 0.70], [2, 0.20], [3, 0.10]]) {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq * h;
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(g * hg, t + 0.008);
      env.gain.exponentialRampToValueAtTime(0.001, t + sus);
      osc.connect(env);
      env.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + sus + 0.05);
    }
  } catch(e) {}
}

// Return the labels of pan notes that belong to the chord (root pc + type intervals).
// Picks the lowest-octave match per pitch class so the chord sounds natural.
function _chordLabels(rootPc, typeName) {
  const intervals = CHORD_TYPES[typeName];
  if (!intervals) return [];
  const targetPcs = new Set(intervals.map(i => (rootPc + i) % 12));
  const byPc = {};
  for (const n of state.notes) {
    const pc = parsePitchClass(n.label);
    if (pc < 0 || !targetPcs.has(pc)) continue;
    if (!byPc[pc] || midiNote(n.label) < midiNote(byPc[pc])) byPc[pc] = n.label;
  }
  return Object.values(byPc);
}

function playChordAudio(labels) {
  if (!Array.isArray(labels) || !labels.length) return;
  ensureAudioCtx();
  labels.forEach(l => playNote(l));
}

function playProgression(chords, rootPc) {
  if (!chords || !chords.length) return;
  ensureAudioCtx();
  const beatMs = (60 / 80) * 1000; // 80 bpm default
  chords.forEach((chord, i) => {
    const root = chord.root !== undefined ? chord.root : ((rootPc ?? 0) + (chord.s ?? 0)) % 12;
    const type = chord.type || chord.t || 'Major';
    const labels = typeof _chordLabels === 'function' ? _chordLabels(root, type) : [];
    if (labels && labels.length) setTimeout(() => playChordAudio(labels), i * beatMs);
  });
}

let _saveTimer = null;
function scheduleSave() {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(LS_LAYOUT, snapshot());
    } catch(e) {}
  }, 800);
}

function saveSettings() {
  try {
    localStorage.setItem(LS_SETTINGS, JSON.stringify({
      enharmonicMode,
      vol: Math.round(audioPreviewVol * 100),
      sustain: audioPreviewSustain,
    }));
  } catch(e) {}
}


function clearSavedData() {
  if (!confirm('Clear all saved data (layout, settings, rhythm edits)?')) return;
  localStorage.removeItem(LS_LAYOUT);
  localStorage.removeItem(LS_SETTINGS);
  localStorage.removeItem(LS_RHYTHMS);
  // Also clear HAT editor settings stored by the embedded iframe
  localStorage.removeItem('hat_settings');
  localStorage.removeItem('hat_src_collapsed');
  location.reload();
}


