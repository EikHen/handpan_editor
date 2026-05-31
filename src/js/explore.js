// ─── Progressions panel ───────────────────────────────────────────────────────

function toRoman(s, type) {
  const UPPER = ['I','♭II','II','♭III','III','IV','♭V','V','♭VI','VI','♭VII','VII'];
  const base = UPPER[((s % 12) + 12) % 12];
  const isMinorQ = ['Minor','Dim','Min7','HalfDim7','Dim7','MinMaj7','Min6'].includes(type);
  const r = isMinorQ ? base.toLowerCase() : base;
  return ['Dim','Dim7'].includes(type) ? r + '°' : type === 'HalfDim7' ? r + 'ø' : r;
}

function chordFunction(s) {
  const sn = ((s % 12) + 12) % 12;
  return {0:'T',2:'S',4:'T',5:'S',7:'D',9:'T',11:'D',3:'T',8:'S',10:'S'}[sn] ?? null;
}

function chordPlayability(rootPc, type) {
  const ivs = CHORD_TYPES[type];
  if (!ivs) return 'none';
  const panPcs = new Set(state.notes.map(n => parsePitchClass(n.label)).filter(p => p >= 0));
  const chord   = ivs.map(i => (rootPc + i) % 12);
  const missing = chord.filter(p => !panPcs.has(p)).length;
  if (missing === 0)             return 'complete';
  if (missing === 1)             return 'partial';
  if (missing < chord.length)   return 'incomplete';
  return 'none';
}

function playScore(play) {
  return play === 'complete' ? 3 : play === 'partial' ? 2 : play === 'incomplete' ? 1 : 0;
}

function progressionScore(prog, rootPc) {
  return prog.chords.reduce((sum, c) =>
    sum + playScore(chordPlayability((rootPc + c.s) % 12, c.t)), 0);
}

function bestRootForProg(prog) {
  const panPcs = [...new Set(state.notes.map(n => parsePitchClass(n.label)).filter(p => p >= 0))];
  if (!panPcs.length) return 0;
  let best = panPcs[0], bestScore = -1;
  for (const pc of panPcs) {
    const sc = progressionScore(prog, pc);
    if (sc > bestScore) { bestScore = sc; best = pc; }
  }
  return best;
}

function playDot(play) {
  if (play === 'complete')   return '<span class="play-dot play-full"   title="Complete — all notes available"  aria-label="Complete">●</span>';
  if (play === 'partial')    return '<span class="play-dot play-partial" title="Partial — 1 note missing"        aria-label="Partial, 1 note missing">◕</span>';
  if (play === 'incomplete') return '<span class="play-dot play-incomplete" title="Incomplete — 2+ notes missing" aria-label="Incomplete, 2 or more notes missing">◔</span>';
  return '<span class="play-dot play-none" title="No coverage" aria-label="No coverage">○</span>';
}


// ─── Mode switching ───────────────────────────────────────────────────────────

function setMode(mode) {
  const prev = appMode;
  if (mode === prev) return;
  appMode = mode;
  document.body.dataset.mode = mode;

  document.querySelectorAll('.mode-tab').forEach(btn => {
    const active = btn.dataset.mode === mode;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });

  if (mode === 'explore') {
    _initExplorePanel();
    document.querySelector('.panel-audio').classList.remove('collapsed');
    render();
  } else if (mode === 'rhythm') {
    _hatFrameInit();
  } else { // 'edit'
    document.querySelector('.panel-audio').classList.add('collapsed');
    if (prev === 'explore') {
      selectedIds.clear();
      hlMode = 'none';
      document.getElementById('hl-mode').value = 'none';
      updateHighlightPanel();
    }
    if (prev === 'rhythm') {
      _clearPanHighlights();
      const panel = document.getElementById('rhythm-panel');
      panel.classList.remove('expanded');
    }
  }
  resizeCanvas();
}

function _initExplorePanel() {
  const isChords = exploreTab === 'chords';
  document.getElementById('mood-filter-section').style.display       = isChords ? 'none' : '';
  document.getElementById('func-legend-section').style.display       = isChords ? 'none' : '';
  document.getElementById('chord-type-filter-section').style.display = isChords ? '' : 'none';
  document.getElementById('chords-export-inner').style.display       = isChords ? '' : 'none';
  document.getElementById('progs-export-inner').style.display        = isChords ? 'none' : '';

  buildRootBar();
  if (isChords) {
    if (customProgOpen) { customProgOpen = false; renderCustomProgBar(); }
    buildChordTypePills();
    renderChords();
  } else {
    buildMoodPills();
    renderProgressions();
    buildProgExportMoodChecks();
    buildProgExportRootBar();
  }
}

function setExploreTab(tab) {
  exploreTab = tab;
  document.querySelectorAll('.explore-tab').forEach(btn =>
    btn.classList.toggle('is-active', btn.id === `etab-${tab}`)
  );
  _initExplorePanel();
}

function triggerExploreExport() {
  if (exploreTab === 'chords') exportAllChordsZip();
  else exportProgressionsZip();
}

function moodAvailability(moodId) {
  const progs = PROGRESSIONS.filter(p => p.moods.includes(moodId));
  if (!progs.length) return 0;
  const total = progs.reduce((sum, prog) => {
    const rootPc = activeRootPc === -1 ? bestRootForProg(prog) : activeRootPc;
    const score  = progressionScore(prog, rootPc);
    const maxScore = prog.chords.length * 3;
    return sum + score / maxScore;
  }, 0);
  return total / progs.length; // 0..1
}

function buildMoodPills() {
  const el = document.getElementById('mood-pills');
  el.innerHTML = '';
  const allPill = document.createElement('button');
  allPill.className = 'mood-pill' + (activeMood === 'all' ? ' active' : '');
  allPill.textContent = 'All';
  allPill.addEventListener('click', () => { activeMood = 'all'; buildMoodPills(); renderProgressions(); });
  el.appendChild(allPill);
  const avails = Object.fromEntries(MOODS.map(m => [m.id, moodAvailability(m.id)]));
  const maxAvail = Math.max(...Object.values(avails), 1e-9);
  for (const mood of MOODS) {
    const avail = avails[mood.id];
    const pill = document.createElement('button');
    pill.className = 'mood-pill' + (mood.id === activeMood ? ' active' : '');
    pill.textContent = `${mood.icon} ${mood.label}`;
    if (mood.id !== activeMood) {
      const l = Math.round(22 + (avail / maxAvail) * 36);
      pill.style.color = `hsl(220,18%,${l}%)`;
    }
    pill.title = `${mood.label} — ${Math.round(avail * 100)}% available on this pan`;
    pill.addEventListener('click', () => {
      activeMood = mood.id;
      buildMoodPills(); renderProgressions();
    });
    el.appendChild(pill);
  }
}

function buildRootBar() {
  const el = document.getElementById('root-bar');
  const panPcs = new Set(state.notes.map(n => parsePitchClass(n.label)).filter(p => p >= 0));
  el.innerHTML = '';

  const auto = document.createElement('button');
  auto.className = 'root-btn' + (activeRootPc === -1 ? ' active' : '');
  auto.textContent = 'Auto';
  auto.title = 'Best root per progression';
  auto.addEventListener('click', () => {
    activeRootPc = -1; buildRootBar();
    if (exploreTab === 'progs') { buildMoodPills(); renderProgressions(); }
    else { renderChords(); }
  });
  el.appendChild(auto);

  for (let i = 0; i < 12; i++) {
    const btn = document.createElement('button');
    btn.className = 'root-btn' +
      (panPcs.has(i) ? ' on-pan' : '') +
      (activeRootPc === i ? ' active' : '');
    btn.textContent = getDisplayNames()[i];
    btn.title = panPcs.has(i) ? `${getDisplayNames()[i]} — on pan` : getDisplayNames()[i];
    btn.addEventListener('click', () => {
      activeRootPc = i; buildRootBar();
      if (exploreTab === 'progs') { buildMoodPills(); renderProgressions(); }
      else { renderChords(); }
    });
    el.appendChild(btn);
  }
}

function renderProgressions() {
  const el = document.getElementById('explore-list');
  el.innerHTML = '';
  const selPcs = (hlMode === 'selection') ? getSelectedPcs() : null;
  const moodFiltered = activeMood === 'all' ? PROGRESSIONS : PROGRESSIONS.filter(p => p.moods.includes(activeMood));

  // When selection is active, only show progressions with ≥1 chord containing all selected pcs
  const filtered = selPcs
    ? moodFiltered.filter(prog => {
        const rootPc = activeRootPc === -1 ? bestRootForProg(prog) : activeRootPc;
        return prog.chords.some(c => chordContainsSelPcs((rootPc + c.s) % 12, c.t, selPcs));
      })
    : moodFiltered;

  if (!filtered.length) {
    el.innerHTML = selPcs
      ? '<div style="padding:20px;font-size:12px;color:var(--fg-whisper);text-align:center;">No progressions contain the selected notes.</div>'
      : '<div style="padding:20px;font-size:12px;color:var(--fg-whisper);text-align:center;">No progressions for this mood.</div>';
    return;
  }

  for (const prog of filtered) {
    const rootPc  = activeRootPc === -1 ? bestRootForProg(prog) : activeRootPc;
    const rootName = getDisplayNames()[rootPc];

    const card = document.createElement('div');
    card.className = 'prog-card';

    const header = document.createElement('div');
    header.className = 'prog-card-header';

    const title = document.createElement('div');
    title.className = 'prog-card-title';
    title.textContent = activeRootPc === -1
      ? `${prog.name}  ·  ${rootName}`
      : prog.name;

    const expandBtn = document.createElement('button');
    expandBtn.className = 'prog-expand-btn';
    expandBtn.textContent = '⤢';
    expandBtn.title = 'Open detailed view in new tab';
    expandBtn.addEventListener('click', e => {
      e.stopPropagation();
      openDetailedProgression(prog, rootPc);
    });

    header.appendChild(title);
    header.appendChild(expandBtn);
    card.appendChild(header);

    card.addEventListener('click', e => {
      playProgression(prog.chords, rootPc);
    });

    const row = document.createElement('div');
    row.className = 'chord-row';

    prog.chords.forEach((c, ci) => {
      const chordRoot = (rootPc + c.s) % 12;
      const play  = chordPlayability(chordRoot, c.t);
      const sym   = CHORD_SYMBOLS[c.t] ?? c.t;
      const roman = toRoman(c.s, c.t);
      const isActive = _activeTile && _activeTile.progName === prog.name && _activeTile.chordIdx === ci;

      const fn = chordFunction(c.s);
      const selMatch = !selPcs || chordContainsSelPcs(chordRoot, c.t, selPcs);
      const tile = document.createElement('div');
      tile.className = 'chord-tile' + (isActive ? ' active-tile' : '') + (fn ? ` fn-${fn}` : '') + (selMatch ? '' : ' sel-dimmed');
      tile.innerHTML =
        `<span class="roman">${roman}</span>` +
        `<span class="t-root">${getDisplayNames()[chordRoot]}</span>` +
        `<span class="t-sym">${sym}</span>` +
        playDot(play);

      tile.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent card-level click from also firing
        playChordAudio(_chordLabels(chordRoot, c.t));
        _activeTile = { progName: prog.name, chordIdx: ci };
        hlMode      = 'chord';
        hlChordRoot = chordRoot;
        hlChordType = c.t;
        document.getElementById('hl-mode').value       = 'chord';
        document.getElementById('hl-chord-root').value = chordRoot;
        document.getElementById('hl-chord-type').value = c.t;
        render(); updateHighlightPanel(); renderProgressions();
      });

      if (selMatch) {
        tile.draggable = true;
        tile.addEventListener('dragstart', e => {
          e.dataTransfer.setData('application/json', JSON.stringify({ root: chordRoot, type: c.t }));
          e.dataTransfer.effectAllowed = 'copy';
        });
      }

      row.appendChild(tile);
    });

    const strip = document.createElement('div');
    strip.className = 'prog-roman-strip';
    strip.textContent = prog.chords.map(c => toRoman(c.s, c.t)).join('  —  ');

    card.appendChild(row);
    card.appendChild(strip);
    el.appendChild(card);
  }
}

// ─── Chords panel ─────────────────────────────────────────────────────────────

const CHORD_TYPE_GROUPS = [
  { id: 'all',    label: 'All' },
  { id: 'Major',  label: 'Major' },
  { id: 'Minor',  label: 'Minor' },
  { id: 'Dim',    label: 'Dim' },
  { id: 'Aug',    label: 'Aug' },
  { id: 'Sus2',   label: 'Sus2' },
  { id: 'Sus4',   label: 'Sus4' },
  { id: 'Maj7',   label: 'Maj7' },
  { id: 'Min7',   label: 'Min7' },
  { id: 'Dom7',   label: 'Dom7' },
  { id: 'Dim7',   label: 'Dim7' },
  { id: 'HalfDim7', label: 'ø7' },
  { id: 'MinMaj7',  label: 'mM7' },
  { id: 'Maj6',   label: 'Maj6' },
  { id: 'Min6',   label: 'Min6' },
];

function chordTypeAvailability(typeName) {
  // Returns 0..1: fraction of 12 roots that are at least 'complete' for this type.
  if (!CHORD_TYPES[typeName]) return 0;
  let complete = 0;
  for (let pc = 0; pc < 12; pc++) {
    if (chordPlayability(pc, typeName) === 'complete') complete++;
  }
  return complete / 12;
}

function chordTypePillAvailability(groupId) {
  // For 'all', average across all types; for specific type, use that type's availability.
  if (groupId === 'all') {
    const types = Object.keys(CHORD_TYPES);
    return types.reduce((s, t) => s + chordTypeAvailability(t), 0) / types.length;
  }
  return chordTypeAvailability(groupId);
}

function buildChordTypePills() {
  const el = document.getElementById('chord-type-pills');
  el.innerHTML = '';
  const avails = Object.fromEntries(CHORD_TYPE_GROUPS.map(g => [g.id, chordTypePillAvailability(g.id)]));
  const maxAvail = Math.max(...Object.values(avails), 1e-9);
  for (const g of CHORD_TYPE_GROUPS) {
    const isActive = g.id === activeChordTypeFilter;
    const pill = document.createElement('button');
    pill.className = 'chord-type-pill' + (isActive ? ' active' : '');
    pill.textContent = g.label;
    if (!isActive) {
      const avail = avails[g.id];
      const l = Math.round(22 + (avail / maxAvail) * 36);
      pill.style.color = `hsl(220,18%,${l}%)`;
    }
    pill.addEventListener('click', () => {
      activeChordTypeFilter = g.id;
      buildChordTypePills();
      renderChords();
    });
    el.appendChild(pill);
  }
}

function renderChords() {
  const el = document.getElementById('explore-list');
  el.innerHTML = '';

  const selPcs = (hlMode === 'selection') ? getSelectedPcs() : null;

  const types = activeChordTypeFilter === 'all'
    ? Object.keys(CHORD_TYPES)
    : [activeChordTypeFilter];

  let anyShown = false;
  for (const typeName of types) {
    const sym = CHORD_SYMBOLS[typeName] ?? typeName;
    const rootsToShow = activeRootPc >= 0 ? [activeRootPc] : [...Array(12).keys()];
    const visibleRoots = selPcs
      ? rootsToShow.filter(r => chordContainsSelPcs(r, typeName, selPcs))
      : rootsToShow;
    if (visibleRoots.length === 0) continue; // skip type entirely when none match
    anyShown = true;

    const card = document.createElement('div');
    card.className = 'chords-card';

    const cardTitle = document.createElement('div');
    cardTitle.className = 'chords-card-title';
    cardTitle.innerHTML = `${typeName} <span class="ct-sym">${sym}</span>`;
    card.appendChild(cardTitle);

    const row = document.createElement('div');
    row.className = 'chord-row chord-row--grid4';

    for (const rootPc of visibleRoots) {
      const play = chordPlayability(rootPc, typeName);
      const isActive = hlMode === 'chord' && hlChordRoot === rootPc && hlChordType === typeName;

      const tile = document.createElement('div');
      tile.className = 'chord-tile' + (isActive ? ' active-tile' : '');
      tile.innerHTML =
        `<span class="roman"></span>` +
        `<span class="t-root">${getDisplayNames()[rootPc]}</span>` +
        `<span class="t-sym">${sym}</span>` +
        playDot(play);

      tile.addEventListener('click', (e) => {
        playChordAudio(_chordLabels(rootPc, typeName));
        _activeTile  = null;
        hlMode       = 'chord';
        hlChordRoot  = rootPc;
        hlChordType  = typeName;
        document.getElementById('hl-mode').value       = 'chord';
        document.getElementById('hl-chord-root').value = rootPc;
        document.getElementById('hl-chord-type').value = typeName;
        render(); updateHighlightPanel(); renderChords();
        if (appMode === 'explore' && exploreTab === 'progs') renderProgressions();
      });

      tile.draggable = true;
      tile.addEventListener('dragstart', e => {
        e.dataTransfer.setData('application/json', JSON.stringify({ root: rootPc, type: typeName }));
        e.dataTransfer.effectAllowed = 'copy';
      });

      row.appendChild(tile);
    }

    card.appendChild(row);
    el.appendChild(card);
  }
  if (selPcs && !anyShown) {
    el.innerHTML = '<div style="padding:20px;font-size:12px;color:var(--fg-whisper);text-align:center;">No chords contain all selected notes.</div>';
  }
}

// ─── Custom Progression Builder ───────────────────────────────────────────────

function buildTightSVGString(highlightPcs) {
  const { cx, cy, r } = state.pan;
  const margin = Math.max(18, Math.round(r * 0.07));
  let bx0 = cx - r - margin, by0 = cy - r - margin;
  let bx1 = cx + r + margin, by1 = cy + r + margin;
  for (const n of state.notes) {
    bx0 = Math.min(bx0, n.x - n.r - margin);
    by0 = Math.min(by0, n.y - n.r - margin);
    bx1 = Math.max(bx1, n.x + n.r + margin);
    by1 = Math.max(by1, n.y + n.r + margin);
  }
  const bw = bx1 - bx0, bh = by1 - by0;
  if (bw > bh) { const d = (bw - bh) / 2; by0 -= d; by1 += d; }
  else          { const d = (bh - bw) / 2; bx0 -= d; bx1 += d; }
  const size = Math.round(bx1 - bx0);
  return buildSVGString(highlightPcs, '').replace(
    'viewBox="0 0 1000 1400"',
    `viewBox="${Math.round(bx0)} ${Math.round(by0)} ${size} ${size}"`
  );
}

function renderCustomProgBar() {
  const bar = document.getElementById('custom-prog-panel');
  if (!bar) return;
  bar.classList.toggle('open', customProgOpen);
  const btn = document.getElementById('custom-prog-toggle-btn');
  if (btn) btn.classList.toggle('cta', customProgOpen);
  if (!customProgOpen) return;

  const container = document.getElementById('custom-prog-slots');
  container.innerHTML = '';

  customProgChords.forEach((ch, i) => {
    const pcs    = new Set((CHORD_TYPES[ch.type] || []).map(iv => (ch.root + iv) % 12));
    const svgStr = buildTightSVGString(pcs);
    const dataUrl = 'data:image/svg+xml,' + encodeURIComponent(svgStr);

    const wrap = document.createElement('div');
    wrap.className = 'custom-prog-slot-wrap' + (customProgSelIdxs.has(i) ? ' selected' : '');

    const slot = document.createElement('div');
    slot.className = 'custom-prog-slot';
    const img = document.createElement('img');
    img.src = dataUrl; img.alt = ''; img.draggable = false;
    slot.appendChild(img);

    const sym = CHORD_SYMBOLS[ch.type] ?? ch.type;
    const lbl = document.createElement('div');
    lbl.className = 'slot-lbl';
    lbl.textContent = getDisplayNames()[ch.root] + sym;

    wrap.appendChild(slot);
    wrap.appendChild(lbl);
    wrap.addEventListener('click', e => {
      if (e.shiftKey) {
        customProgSelIdxs.has(i) ? customProgSelIdxs.delete(i) : customProgSelIdxs.add(i);
      } else {
        customProgSelIdxs = new Set([i]);
      }
      renderCustomProgBar();
      e.stopPropagation();
    });
    container.appendChild(wrap);
  });

  if (customProgChords.length < 5) {
    const add = document.createElement('div');
    add.className = 'custom-prog-add-slot';
    add.title = 'Drag a chord here';
    add.textContent = '＋';
    container.appendChild(add);
  }
}

function toggleCustomProg() {
  customProgOpen = !customProgOpen;
  if (!customProgOpen) customProgSelIdxs.clear();
  renderCustomProgBar();
  resizeCanvas();
}

function playCustomProg() {
  if (!customProgChords.length) return;
  const beatMs = (60 / 90) * 1000;
  customProgChords.forEach((ch, i) => {
    const labels = _chordLabels(ch.root, ch.type);
    if (labels.length) setTimeout(() => playChordAudio(labels), i * beatMs);
  });
}

function setupCustomProgDnD() {
  const container = document.getElementById('custom-prog-slots');
  if (!container) return;

  container.addEventListener('dragover', e => {
    if (customProgOpen && customProgChords.length < 5) e.preventDefault();
  });
  container.addEventListener('dragenter', e => {
    if (!customProgOpen || customProgChords.length >= 5) return;
    const addSlot = container.querySelector('.custom-prog-add-slot');
    if (addSlot) addSlot.classList.add('drag-over');
  });
  container.addEventListener('dragleave', e => {
    if (!container.contains(e.relatedTarget)) {
      container.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    }
  });
  container.addEventListener('drop', e => {
    e.preventDefault();
    container.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    if (!customProgOpen || customProgChords.length >= 5) return;
    let data;
    try { data = JSON.parse(e.dataTransfer.getData('application/json')); } catch { return; }
    if (typeof data.root !== 'number' || !data.type) return;
    customProgChords.push({ root: data.root, type: data.type });
    customProgSelIdxs.clear();
    renderCustomProgBar();
  });
}

// ─── Progressions export ─────────────────────────────────────────────────────

function buildProgressionsSVG(moodId) {
  const mood  = MOODS.find(m => m.id === moodId);
  const progs = PROGRESSIONS.filter(p => p.moods.includes(moodId));
  const W = 1000, ML = 50;
  const innerW  = W - ML * 2;
  const headerH = 100;
  const legendH = 55;
  const gap     = 18;
  const cardH   = 160;
  const tileH   = cardH - 50;
  const H       = headerH + 26 + progs.length * (cardH + gap) + legendH;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="white"/>
<rect x="0" y="0" width="${W}" height="${headerH}" fill="#f4f4f8"/>
<line x1="0" y1="${headerH}" x2="${W}" y2="${headerH}" stroke="#ddd" stroke-width="1.5"/>
<text x="${ML}" y="60" font-family="Arial,sans-serif" font-size="40" font-weight="bold" fill="#1a1a2e">${mood.icon} ${mood.label}</text>`;

  const rootLabel = activeRootPc >= 0
    ? `Root: ${getDisplayNames()[activeRootPc]}`
    : 'Auto root (best per progression)';
  svg += `<text x="${ML}" y="85" font-family="Arial,sans-serif" font-size="14" fill="#aaa">${rootLabel}</text>`;

  let y = headerH + 26;

  for (const prog of progs) {
    const rootPc  = activeRootPc === -1 ? bestRootForProg(prog) : activeRootPc;
    const nChords = prog.chords.length;
    const tileGap = 10;
    const tileW   = Math.floor((innerW - 28 - (nChords - 1) * tileGap) / nChords);
    const tileY   = y + 38;

    svg += `<rect x="${ML}" y="${y}" width="${innerW}" height="${cardH}" rx="8" fill="#f9f9fc" stroke="#e4e4ee" stroke-width="1.2"/>`;

    const titleStr = activeRootPc === -1
      ? `${prog.name}  ·  ${getDisplayNames()[rootPc]}`
      : prog.name;
    svg += `<text x="${ML + 14}" y="${y + 24}" font-family="Arial,sans-serif" font-size="13" fill="#888">${titleStr}</text>`;

    prog.chords.forEach((c, ci) => {
      const chordRoot = (rootPc + c.s) % 12;
      const play  = chordPlayability(chordRoot, c.t);
      const sym   = CHORD_SYMBOLS[c.t] ?? c.t;
      const roman = toRoman(c.s, c.t);
      const tileX = ML + 14 + ci * (tileW + tileGap);
      const cx    = tileX + tileW / 2;

      const bg  = play === 'complete' ? '#eef8f3' : play === 'partial' ? '#fdf5e8' : play === 'incomplete' ? '#fdf0f0' : '#f5f5f8';
      const brd = play === 'complete' ? '#aed4bc' : play === 'partial' ? '#d4c090' : play === 'incomplete' ? '#d4a0a0' : '#dcdce8';
      svg += `<rect x="${tileX}" y="${tileY}" width="${tileW}" height="${tileH}" rx="6" fill="${bg}" stroke="${brd}" stroke-width="1.2"/>`;

      const ry  = tileY + Math.round(tileH * 0.16);
      const ny  = tileY + Math.round(tileH * 0.48);
      const sy  = tileY + Math.round(tileH * 0.70);
      const dy  = tileY + Math.round(tileH * 0.88);
      const nfs = Math.min(30, Math.round(tileH * 0.26));
      const sfs = Math.max(11, Math.round(tileH * 0.14));

      svg += `<text x="${cx}" y="${ry}" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" fill="#bbb">${roman}</text>`;
      svg += `<text x="${cx}" y="${ny}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${nfs}" font-weight="bold" fill="#222">${getDisplayNames()[chordRoot]}</text>`;
      svg += `<text x="${cx}" y="${sy}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${sfs}" fill="#5b8db8">${sym}</text>`;

      const dc = play === 'complete' ? '#44cc88' : play === 'partial' ? '#cc8800' : play === 'incomplete' ? '#cc4444' : '#ccc';
      const dd = play === 'complete' ? '●' : play === 'partial' ? '◕' : play === 'incomplete' ? '◔' : '○';
      svg += `<text x="${cx}" y="${dy}" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" fill="${dc}">${dd}</text>`;
    });

    y += cardH + gap;
  }

  const legY = H - 22;
  svg += `<text x="${ML}" y="${legY}" font-family="Arial,sans-serif" font-size="12" fill="#bbb">● Complete   ◕ −1 note   ◔ −2+ notes   ○ None</text>`;
  svg += '\n</svg>';
  return svg;
}

async function openDetailedProgression(prog, rootPc) {
  setExportStatus('Rendering …');
  try {
    const blob = await buildDetailedProgressionPng(prog, rootPc);
    const url  = URL.createObjectURL(blob);
    const tab  = window.open(url, '_blank');
    if (tab) setTimeout(() => URL.revokeObjectURL(url), 15000);
  } finally {
    setExportStatus('');
  }
}

async function buildDetailedProgressionPng(prog, rootPc) {
  const SCALE   = 2;            // render at 2× resolution for crisp display
  const W       = 1000;
  const nChords = prog.chords.length;
  const cols    = nChords === 1 ? 1 : 2;
  const rows    = Math.ceil(nChords / cols);

  // Source crop: tight bounding box around ALL notes (including outliers) + pan body
  const { cx: panCx, cy: panCy, r: panR } = state.pan;
  const margin = 40;
  let bx0 = panCx - panR, by0 = panCy - panR;
  let bx1 = panCx + panR, by1 = panCy + panR;
  for (const n of state.notes) {
    bx0 = Math.min(bx0, n.x - n.r);
    by0 = Math.min(by0, n.y - n.r);
    bx1 = Math.max(bx1, n.x + n.r);
    by1 = Math.max(by1, n.y + n.r);
  }
  bx0 -= margin; by0 -= margin; bx1 += margin; by1 += margin;
  // Expand to square so drawImage doesn't distort
  const bw = bx1 - bx0, bh = by1 - by0;
  if (bw > bh) { const d = (bw - bh) / 2; by0 -= d; by1 += d; }
  else          { const d = (bh - bw) / 2; bx0 -= d; bx1 += d; }
  const srcX    = Math.max(0, Math.round(bx0));
  const srcY    = Math.max(0, Math.round(by0));
  const srcSize = Math.min(Math.round(bx1) - srcX, Math.round(by1) - srcY, 1000 - srcX, 1400 - srcY);

  const headerH = 140;
  const footerH = 44;
  const infoH   = 148;
  const panPad  = 16;
  const cellW   = Math.floor(W / cols);
  const panSize = cellW - panPad * 2;   // destination square for each pan
  const cellH   = infoH + panSize + panPad;
  const H       = headerH + rows * cellH + footerH;

  const canvas = document.createElement('canvas');
  canvas.width  = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE, SCALE);

  // ── Background & header ──
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#f4f4f8';
  ctx.fillRect(0, 0, W, headerH);
  ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, headerH); ctx.lineTo(W, headerH); ctx.stroke();

  ctx.fillStyle = '#1a1a2e';
  ctx.font = 'bold 36px Arial, sans-serif';
  ctx.fillText(prog.name, 40, 56);
  ctx.fillStyle = '#aaa';
  ctx.font = '13px Arial, sans-serif';
  ctx.fillText(`Root: ${getDisplayNames()[rootPc]}${activeRootPc === -1 ? ' (auto)' : ''}`, 40, 84);
  ctx.fillStyle = '#777';
  ctx.font = '18px "Courier New", monospace';
  ctx.fillText(prog.chords.map(c => toRoman(c.s, c.t)).join('  —  '), 40, 118);

  // ── Chord cells ──
  for (let ci = 0; ci < nChords; ci++) {
    const c         = prog.chords[ci];
    const col       = ci % cols;
    const row       = Math.floor(ci / cols);
    const cellX     = col * cellW;
    const cellY     = headerH + row * cellH;
    const icx       = cellX + cellW / 2;
    const chordRoot = (rootPc + c.s) % 12;
    const play      = chordPlayability(chordRoot, c.t);
    const sym       = CHORD_SYMBOLS[c.t] ?? c.t;
    const roman     = toRoman(c.s, c.t);
    const fn        = chordFunction(c.s);

    // Cell dividers
    ctx.strokeStyle = '#e8e8ee'; ctx.lineWidth = 1;
    if (col > 0) {
      ctx.beginPath(); ctx.moveTo(cellX, cellY); ctx.lineTo(cellX, cellY + cellH); ctx.stroke();
    }
    if (row > 0 && col === 0) {
      ctx.beginPath(); ctx.moveTo(0, cellY); ctx.lineTo(W, cellY); ctx.stroke();
    }

    // Functional accent bar
    const fnColor = fn === 'T' ? '#3a6080' : fn === 'S' ? '#2a6040' : fn === 'D' ? '#804020' : '#d8d8e8';
    ctx.fillStyle = fnColor;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(cellX + 20, cellY + 10, cellW - 40, 4, 2);
    else ctx.rect(cellX + 20, cellY + 10, cellW - 40, 4);
    ctx.fill();

    // Chord info text
    ctx.textAlign = 'center';
    ctx.fillStyle = '#aaa';    ctx.font = '13px Arial, sans-serif';
    ctx.fillText(roman, icx, cellY + 36);
    ctx.fillStyle = '#1a1a2e'; ctx.font = 'bold 52px Arial, sans-serif';
    ctx.fillText(getDisplayNames()[chordRoot], icx, cellY + 90);
    ctx.fillStyle = '#5b8db8'; ctx.font = '20px Arial, sans-serif';
    ctx.fillText(sym, icx, cellY + 116);
    const dc = play === 'complete' ? '#44cc88' : play === 'partial' ? '#cc8800' : play === 'incomplete' ? '#cc4444' : '#bbb';
    const dd = play === 'complete' ? '● Complete' : play === 'partial' ? '◕ −1 note' : play === 'incomplete' ? '◔ −2+ notes' : '○ Not available';
    ctx.fillStyle = dc; ctx.font = '11px Arial, sans-serif';
    ctx.fillText(dd, icx, cellY + 138);
    ctx.textAlign = 'left';

    // ── Pan image: render existing buildSVGString, crop to pan circle, paste ──
    const highlightPcs = new Set((CHORD_TYPES[c.t] ?? []).map(i => (chordRoot + i) % 12));
    const panSvg = buildSVGString(highlightPcs, '');
    const panImg = await new Promise((res, rej) => {
      const blob = new Blob([panSvg], { type: 'image/svg+xml;charset=utf-8' });
      const url  = URL.createObjectURL(blob);
      const img  = new Image();
      img.onload  = () => { URL.revokeObjectURL(url); res(img); };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('pan svg failed')); };
      img.src = url;
    });

    const destX = cellX + panPad;
    const destY = cellY + infoH;
    // drawImage(src, srcX, srcY, srcW, srcH, destX, destY, destW, destH)
    ctx.drawImage(panImg, srcX, srcY, srcSize, srcSize, destX, destY, panSize, panSize);
  }

  // ── Footer ──
  ctx.fillStyle = '#bbb'; ctx.font = '11px Arial, sans-serif';
  ctx.fillText('■ Tonic  ■ Subdominant  ■ Dominant  |  ● Complete  ◕ −1 note  ◔ −2+ notes  ○ None', 40, H - 14);

  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}

// ─── Progressions export (filterable) ────────────────────────────────────────

function buildProgExportMoodChecks() {
  const el = document.getElementById('prog-export-mood-checks');
  if (!el) return;
  el.innerHTML = '';
  for (const mood of MOODS) {
    const lbl = document.createElement('label');
    lbl.style.cssText = 'display:flex;align-items:center;gap:4px;font-size:11px;color:#aab;cursor:pointer;';
    lbl.innerHTML = `<input type="checkbox" value="${mood.id}" checked style="accent-color:#5b8db8;cursor:pointer;"> ${mood.icon} ${mood.label}`;
    el.appendChild(lbl);
  }
}

function checkAllProgExportMoods(on) {
  document.getElementById('prog-export-mood-checks')
    .querySelectorAll('input[type=checkbox]').forEach(cb => cb.checked = on);
}

function buildProgExportRootBar() {
  const el = document.getElementById('prog-export-root-bar');
  if (!el) return;
  const panPcs = new Set(state.notes.map(n => parsePitchClass(n.label)).filter(p => p >= 0));
  el.innerHTML = '';

  function toggle(key) {
    if (progExportRootPcs.has(key)) {
      if (progExportRootPcs.size > 1) progExportRootPcs.delete(key);
    } else {
      progExportRootPcs.add(key);
    }
    buildProgExportRootBar();
  }

  const auto = document.createElement('button');
  auto.className = 'root-btn' + (progExportRootPcs.has(-1) ? ' active' : '');
  auto.textContent = 'Auto';
  auto.title = 'Best root per progression (auto)';
  auto.addEventListener('click', () => toggle(-1));
  el.appendChild(auto);

  for (let i = 0; i < 12; i++) {
    const btn = document.createElement('button');
    btn.className = 'root-btn' +
      (panPcs.has(i) ? ' on-pan' : '') +
      (progExportRootPcs.has(i) ? ' active' : '');
    btn.textContent = getDisplayNames()[i];
    btn.title = (panPcs.has(i) ? `${getDisplayNames()[i]} — on pan` : getDisplayNames()[i]) + ' (click to toggle)';
    btn.addEventListener('click', () => toggle(i));
    el.appendChild(btn);
  }
}

function setProgExportStatus(msg) {
  const el = document.getElementById('prog-export-status');
  if (el) el.textContent = msg;
  if (msg.startsWith('Done')) showToast(msg);
}

async function exportProgressionsZip() {
  if (typeof JSZip === 'undefined') { alert('JSZip not loaded — check internet connection.'); return; }

  const selectedMoodIds = [...document.getElementById('prog-export-mood-checks')
    .querySelectorAll('input:checked')].map(cb => cb.value);
  if (!selectedMoodIds.length) { setProgExportStatus('No moods selected.'); return; }

  const exportRoots  = [...progExportRootPcs]; // array of -1 and/or 0..11
  const multiRoot    = exportRoots.length > 1;
  const selectedMoods = MOODS.filter(m => selectedMoodIds.includes(m.id));
  const progsPerMood  = selectedMoods.flatMap(m => PROGRESSIONS.filter(p => p.moods.includes(m.id)));
  // total images = (overviews + detailed) × number of roots
  const total = (selectedMoods.length + progsPerMood.length) * exportRoots.length;
  let done = 0;

  const zip = new JSZip();
  const savedRootPc = activeRootPc;

  try {
    for (const rootPc of exportRoots) {
      const rootLabel = rootPc === -1 ? 'Auto' : getDisplayNames()[rootPc];
      activeRootPc = rootPc; // override for buildProgressionsSVG

      const base     = multiRoot ? zip.folder(`handpan-progressions/${rootLabel}`) : zip.folder('handpan-progressions');
      const detailed = base.folder('detailed');

      for (const mood of selectedMoods) {
        done++;
        setProgExportStatus(`${done}/${total}  [${rootLabel}] ${mood.label} overview …`);
        const png = await svgToPngBlob(buildProgressionsSVG(mood.id));
        base.file(`${mood.label}.png`, png);
      }

      for (const mood of selectedMoods) {
        const moodFolder = detailed.folder(mood.label);
        const progs = PROGRESSIONS.filter(p => p.moods.includes(mood.id));
        for (let pi = 0; pi < progs.length; pi++) {
          const prog = progs[pi];
          done++;
          setProgExportStatus(`${done}/${total}  [${rootLabel}] ${mood.label} / ${prog.name} …`);
          const usedRoot = rootPc === -1 ? bestRootForProg(prog) : rootPc;
          const png      = await buildDetailedProgressionPng(prog, usedRoot);
          const idx  = String(pi + 1).padStart(2, '0');
          const slug = prog.name.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '');
          moodFolder.file(`${idx}-${slug}.png`, png);
        }
      }
    }
  } finally {
    activeRootPc = savedRootPc;
  }

  setProgExportStatus('Building ZIP …');
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  dlBlob(zipBlob, 'handpan-progressions.zip');
  setProgExportStatus(`Done — ${done} images exported.`);
  setTimeout(() => setProgExportStatus(''), 6000);
}

async function exportMoodsZip() {
  if (typeof JSZip === 'undefined') { alert('JSZip not loaded — check internet connection.'); return; }

  const zip      = new JSZip();
  const rootDir  = zip.folder('handpan-progressions');
  const detailed = rootDir.folder('detailed');

  const allDetailedProgs = MOODS.flatMap(m => PROGRESSIONS.filter(p => p.moods.includes(m.id)));
  const total = MOODS.length + allDetailedProgs.length;
  let done = 0;

  // Overview: one image per mood
  for (const mood of MOODS) {
    done++;
    setExportStatus(`${done}/${total}  ${mood.label} overview …`);
    const png = await svgToPngBlob(buildProgressionsSVG(mood.id));
    rootDir.file(`${mood.label}.png`, png);
  }

  // Detailed: one image per progression per mood
  for (const mood of MOODS) {
    const moodFolder = detailed.folder(mood.label);
    const progs = PROGRESSIONS.filter(p => p.moods.includes(mood.id));
    for (let pi = 0; pi < progs.length; pi++) {
      const prog   = progs[pi];
      done++;
      setExportStatus(`${done}/${total}  ${mood.label} / ${prog.name} …`);
      const rootPc = activeRootPc === -1 ? bestRootForProg(prog) : activeRootPc;
      const png    = await buildDetailedProgressionPng(prog, rootPc);
      const idx  = String(pi + 1).padStart(2, '0');
      const slug = prog.name.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '');
      moodFolder.file(`${idx}-${slug}.png`, png);
    }
  }

  setExportStatus('Building ZIP …');
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  dlBlob(zipBlob, 'handpan-progressions.zip');
  setExportStatus(`Done — ${total} images exported.`);
  setTimeout(() => setExportStatus(''), 6000);
}

