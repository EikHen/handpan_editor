/* eslint-disable no-undef */
// Minimal Web Audio synthesis — sine-with-AD-envelope tone per note.
// Mirrors what the source editor does for Alt+Click previews.

(function () {
  let ac = null;
  function ctx() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ac = new AC();
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }

  function pcOfLabel(label) {
    return window.parsePitchClass(label);
  }

  function octOfLabel(label) {
    const m = String(label || '').match(/(-?\d)\s*$/);
    return m ? parseInt(m[1], 10) : 4;
  }

  function freqOf(pc, oct) {
    if (pc < 0) return null;
    // MIDI 69 = A4 = 440 Hz, pc 9 = A. semitones from A4:
    const semi = (pc - 9) + (oct - 4) * 12;
    return 440 * Math.pow(2, semi / 12);
  }

  window.playFreq = function (freq, opts) {
    if (!freq) return;
    const c = ctx(); if (!c) return;
    const { sustain = 0.8, volume = 0.5 } = opts || {};
    const now = c.currentTime;
    const osc1 = c.createOscillator();
    const osc2 = c.createOscillator();
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.value = freq;
    osc2.frequency.value = freq * 2;       // octave overtone, quieter
    const gain = c.createGain();
    gain.gain.value = 0;
    gain.gain.linearRampToValueAtTime(volume, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, now + sustain);
    const g2 = c.createGain();
    g2.gain.value = 0.18;
    osc1.connect(gain);
    osc2.connect(g2).connect(gain);
    gain.connect(c.destination);
    osc1.start(now); osc2.start(now);
    osc1.stop(now + sustain + 0.05);
    osc2.stop(now + sustain + 0.05);
  };

  window.playNote = function (label, opts) {
    const pc = pcOfLabel(label);
    const oct = octOfLabel(label);
    const freq = freqOf(pc, oct);
    if (freq) window.playFreq(freq, opts);
  };

  // Play a chord (root pc + type name) — quick rolled arpeggio.
  window.playChord = function (rootPc, type, opts) {
    const ivs = window.CHORD_TYPES[type] || [];
    const baseOct = 4;
    const c = ctx(); if (!c) return;
    const startAt = c.currentTime;
    const stride = 0.06;
    ivs.forEach((iv, i) => {
      const pc = (rootPc + iv) % 12;
      // wrap to keep octave order ascending
      const oct = baseOct + Math.floor((rootPc + iv) / 12);
      const freq = freqOf(pc, oct);
      if (!freq) return;
      setTimeout(() => window.playFreq(freq, opts), i * stride * 1000);
    });
  };

  // Rhythm cell beep — distinct tone per hand.
  window.playClick = function (hand, glyph) {
    if (glyph === '-' || glyph === '•') return; // rest / ghost too quiet
    const c = ctx(); if (!c) return;
    const now = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'square';
    osc.frequency.value = hand === 'r' ? 660 : 280;  // higher for R
    if (glyph === 'd' || glyph === 't') { osc.frequency.value *= 0.7; }
    gain.gain.value = 0;
    gain.gain.linearRampToValueAtTime(0.18, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain).connect(c.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  };
})();
