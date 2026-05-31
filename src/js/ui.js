// ─── Sidebar controls wiring ──────────────────────────────────────────────────

// Note props
const propLabel = document.getElementById('prop-label');
propLabel.addEventListener('input', () => {
  if (appMode !== 'edit') return;
  const n = state.notes.find(nd => selectedIds.has(nd.id));
  if (n) { n.label = propLabel.value; render(); updateHighlightPanel(); }
});
propLabel.addEventListener('change', () => {
  if (appMode !== 'edit') return;
  const n = state.notes.find(nd => selectedIds.has(nd.id));
  if (n && enharmonicMode !== '-') {
    n.label = rewriteLabel(n.label);
    propLabel.value = n.label;
    render(); updateHighlightPanel();
  }
  pushHistory();
});
propLabel.addEventListener('keydown', e => { if (e.key === 'Enter') propLabel.blur(); });

const propR = document.getElementById('prop-r');
propR.addEventListener('input', () => {
  if (appMode !== 'edit') return;
  const r = +propR.value;
  document.getElementById('prop-r-val').textContent = r;
  for (const n of state.notes) if (selectedIds.has(n.id)) n.r = r;
  renderNotes();
});
propR.addEventListener('change', pushHistory);

const propRMulti = document.getElementById('prop-r-multi');
propRMulti.addEventListener('input', () => {
  if (appMode !== 'edit') return;
  const r = +propRMulti.value;
  document.getElementById('prop-r-multi-val').textContent = r;
  for (const n of state.notes) if (selectedIds.has(n.id)) n.r = r;
  renderNotes();
});
propRMulti.addEventListener('change', pushHistory);

// Pan radius
const panR = document.getElementById('pan-r');
panR.addEventListener('input', () => {
  state.pan.r = +panR.value;
  document.getElementById('pan-r-val').textContent = state.pan.r;
  renderPan();
});
panR.addEventListener('change', pushHistory);

// Enharmonics dropdown
document.getElementById('enharmonic-mode').addEventListener('change', function() {
  enharmonicMode = this.value;
  applyEnharmonics();
  pushHistory(); render(); syncSidebar();
  refreshChordRootDropdown();
  if (appMode === 'explore') { _initExplorePanel(); }
  updateChordInfo(); buildNoteLegend();
  saveSettings();
});

// Audio controls
document.getElementById('audio-vol').addEventListener('input', function() {
  audioPreviewVol = this.value / 100;
  document.getElementById('audio-vol-val').textContent = this.value;
  saveSettings();
  _hatSend({ type: 'hat:set-volume', masterVolume: audioPreviewVol });
});
document.getElementById('audio-sustain').addEventListener('input', function() {
  audioPreviewSustain = parseFloat(this.value);
  document.getElementById('audio-sustain-val').textContent = this.value;
  saveSettings();
  _hatSend({ type: 'hat:set-sustain', sustain: audioPreviewSustain });
});

// Templates dropdown
const templateSelect = document.getElementById('template-select');
templateSelect.addEventListener('change', e => {
  const idx = e.target.value;
  if (idx === '') return;
  const tpl    = TEMPLATES[+idx];
  state.pan    = JSON.parse(JSON.stringify(tpl.pan));
  state.notes  = JSON.parse(JSON.stringify(tpl.notes));
  state.nextId = 1;
  for (const n of state.notes) { const num = parseInt(n.id.replace(/\D/g,'')); if (!isNaN(num) && num >= state.nextId) state.nextId = num + 1; }
  state.pan.name = tpl.name;
  const panNameEl = document.getElementById('pan-name');
  if (panNameEl) panNameEl.value = tpl.name;
  selectedIds.clear();
  if (enharmonicMode !== '-') applyEnharmonics();
  pushHistory(); render(); syncSidebar(); syncPanSlider();
  templateSelect.value = '';
});

// Highlight mode
document.getElementById('hl-mode').addEventListener('change', e => {
  hlMode = e.target.value; render(); updateHighlightPanel();
  if (appMode === 'explore' && exploreTab === 'chords') renderChords();
});

// Populate chord type dropdown
const chordTypeEl = document.getElementById('hl-chord-type');
Object.keys(CHORD_TYPES).forEach(name => {
  const o = document.createElement('option');
  o.value = name; o.textContent = `${CHORD_SYMBOLS[name] ?? ''} ${name}`;
  chordTypeEl.appendChild(o);
});
chordTypeEl.addEventListener('change', e => {
  hlChordType = e.target.value; render(); updateChordInfo();
  if (appMode === 'explore' && exploreTab === 'chords') renderChords();
});

// Populate root dropdown
const chordRootEl = document.getElementById('hl-chord-root');
PC_NAMES.forEach((name, i) => {
  const o = document.createElement('option');
  o.value = i; o.textContent = name;
  chordRootEl.appendChild(o);
});

function refreshChordRootDropdown() {
  const names = getDisplayNames();
  const opts = chordRootEl.options;
  for (let i = 0; i < 12; i++) if (opts[i]) opts[i].textContent = names[i];
}
chordRootEl.addEventListener('change', e => {
  hlChordRoot = +e.target.value; render(); updateChordInfo();
  if (appMode === 'explore' && exploreTab === 'chords') renderChords();
});

// Populate chord type checkboxes for ZIP export
const CHECKED_BY_DEFAULT = new Set(['Major','Minor','Dim','Sus2','Sus4','Maj7','Min7','Dom7']);
const chordChecks = document.getElementById('chord-checks');
Object.keys(CHORD_TYPES).forEach(name => {
  const lbl = document.createElement('label');
  lbl.innerHTML = `<input type="checkbox" value="${name}" ${CHECKED_BY_DEFAULT.has(name)?'checked':''}> ${name}`;
  chordChecks.appendChild(lbl);
});

function checkAllChordTypes(on) {
  chordChecks.querySelectorAll('input[type=checkbox]').forEach(cb => cb.checked = on);
}

function getSelectedChordTypes() {
  return [...chordChecks.querySelectorAll('input[type=checkbox]:checked')].map(cb => cb.value);
}

// ─── Keyboard ─────────────────────────────────────────────────────────────────

document.addEventListener('keydown', e => {
  const inInput = ['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName);
  if (!inInput && customProgOpen && customProgSelIdxs.size > 0 &&
      (e.key === 'Delete' || e.key === 'Backspace')) {
    e.preventDefault();
    customProgChords = customProgChords.filter((_, i) => !customProgSelIdxs.has(i));
    customProgSelIdxs.clear();
    renderCustomProgBar();
    return;
  }
  if (!inInput && appMode === 'edit') {
    if (e.key === 'Delete' || e.key === 'Backspace') { deleteSelected(); return; }
    if (e.key === 'Escape') { selectedIds.clear(); render(); syncSidebar(); return; }
    if (e.key === 'a' && (e.ctrlKey||e.metaKey)) { e.preventDefault(); selectAll(); return; }
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
      e.preventDefault();
      const d = e.shiftKey ? 10 : 1;
      for (const n of state.notes) {
        if (!selectedIds.has(n.id)) continue;
        if (e.key==='ArrowUp')    n.y -= d;
        if (e.key==='ArrowDown')  n.y += d;
        if (e.key==='ArrowLeft')  n.x -= d;
        if (e.key==='ArrowRight') n.x += d;
      }
      renderNotes();
      clearTimeout(nudgeTimer);
      nudgeTimer = setTimeout(pushHistory, 400);
      return;
    }
  }
  if (e.key==='z' && (e.ctrlKey||e.metaKey) && !e.shiftKey) {
    e.preventDefault();
    undo();
  }
  if ((e.key==='y' && (e.ctrlKey||e.metaKey)) ||
      (e.key==='z' && (e.ctrlKey||e.metaKey) && e.shiftKey)) { e.preventDefault(); redo(); }
  if (e.key==='d' && (e.ctrlKey||e.metaKey)) { e.preventDefault(); duplicateSelected(); }
});

// ─── Rhythm panel resize (vertical — top edge drag) ──────────────────────────
(function () {
  const handle = document.getElementById('rhythm-resize-handle');
  const panel  = document.getElementById('rhythm-panel');
  let active = false, startY = 0, startH = 0;
  handle.addEventListener('mousedown', e => {
    active = true; startY = e.clientY; startH = panel.offsetHeight;
    handle.classList.add('dragging'); e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!active) return;
    const h = Math.max(180, Math.min(window.innerHeight - 120, startH - (e.clientY - startY)));
    panel.style.height = h + 'px';
    resizeCanvas();
  });
  document.addEventListener('mouseup', () => {
    if (active) { active = false; handle.classList.remove('dragging'); }
  });
})();

// ─── Explore panel resize ─────────────────────────────────────────────────────

(function () {
  const handle = document.getElementById('explore-resize-handle');
  const panel  = document.getElementById('explore-panel');
  let active = false, startX = 0, startW = 0;

  handle.addEventListener('mousedown', e => {
    active = true; startX = e.clientX; startW = panel.offsetWidth;
    handle.classList.add('dragging'); e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!active) return;
    const w = Math.max(260, Math.min(640, startW - (e.clientX - startX)));
    panel.style.width = w + 'px'; panel.style.minWidth = w + 'px';
    resizeCanvas();
  });
  document.addEventListener('mouseup', () => {
    if (active) { active = false; handle.classList.remove('dragging'); }
  });
})();

// ─── Custom prog panel resize (vertical — top edge drag) ─────────────────────
(function () {
  const handle = document.getElementById('custom-prog-resize-handle');
  const panel  = document.getElementById('custom-prog-panel');
  let active = false, startY = 0, startH = 0;
  handle.addEventListener('mousedown', e => {
    active = true; startY = e.clientY; startH = panel.offsetHeight;
    handle.classList.add('dragging'); e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!active) return;
    const h = Math.max(120, Math.min(window.innerHeight - 160, startH - (e.clientY - startY)));
    panel.style.height = h + 'px';
    resizeCanvas();
  });
  document.addEventListener('mouseup', () => {
    if (active) { active = false; handle.classList.remove('dragging'); }
  });
})();

// ─── Sidebar resize (right-edge drag) ────────────────────────────────────────
(function () {
  const handle = document.getElementById('sidebar-resize-handle');
  const panel  = document.getElementById('sidebar');
  let active = false, startX = 0, startW = 0;
  handle.addEventListener('mousedown', e => {
    active = true; startX = e.clientX; startW = panel.offsetWidth;
    handle.classList.add('dragging'); e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!active) return;
    const w = Math.max(180, Math.min(480, startW + (e.clientX - startX)));
    panel.style.width = w + 'px'; panel.style.minWidth = w + 'px';
    resizeCanvas();
  });
  document.addEventListener('mouseup', () => {
    if (active) { active = false; handle.classList.remove('dragging'); }
  });
})();

// ─── Sidebar / explore panel collapse toggles ─────────────────────────────────
function _updateEdgeBtnIcons() {
  const sidebarCollapsed  = document.getElementById('sidebar').classList.contains('collapsed');
  const exploreCollapsed  = document.getElementById('explore-panel').classList.contains('collapsed');
  const sBtn = document.getElementById('sidebar-toggle');
  const eBtn = document.getElementById('explore-toggle');
  if (sBtn) {
    sBtn.textContent = sidebarCollapsed ? '›' : '‹';
    sBtn.setAttribute('aria-label', sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar');
  }
  if (eBtn) {
    eBtn.textContent = exploreCollapsed ? '‹' : '›';
    eBtn.setAttribute('aria-label', exploreCollapsed ? 'Expand explore panel' : 'Collapse explore panel');
  }
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed');
  _updateEdgeBtnIcons();
  resizeCanvas();
}

function toggleExplorePanel() {
  document.getElementById('explore-panel').classList.toggle('collapsed');
  _updateEdgeBtnIcons();
  resizeCanvas();
}

// ─── Canvas sizing ────────────────────────────────────────────────────────────

function resizeCanvas() {
  if (appMode === 'rhythm') return; // canvas not visible
  const wrap = document.getElementById('canvas-wrap');
  if (!wrap || !wrap.clientWidth || !wrap.clientHeight) return; // ResizeObserver will re-trigger
  const maxW = wrap.clientWidth - 24;
  const maxH = wrap.clientHeight - 24;
  const aspect = 1000 / 1400; // card aspect ratio (5:7)
  let w, h;
  if (maxW / maxH > aspect) {
    h = maxH; w = Math.round(h * aspect);
  } else {
    w = maxW; h = Math.round(w / aspect);
  }
  SVG.style.width = w + 'px';
  SVG.style.height = h + 'px';
}
window.addEventListener('resize', resizeCanvas);
// ResizeObserver fires when canvas-wrap first gets a non-zero layout size —
// more reliable than rAF or window 'load' (which is blocked by iframe loading).
(function () {
  const wrap = document.getElementById('canvas-wrap');
  if (!wrap) return;
  if (window.ResizeObserver) {
    new ResizeObserver(() => { if (appMode !== 'rhythm') { resizeCanvas(); render(); } }).observe(wrap);
  } else {
    window.addEventListener('load', () => { resizeCanvas(); render(); }); // Safari <13 fallback
  }
})();

function syncPanSlider() {
  panR.value = state.pan.r;
  document.getElementById('pan-r-val').textContent = state.pan.r;
}

// ─── Help modal ───────────────────────────────────────────────────────────────

function setHelpTab(tab) {
  document.querySelectorAll('.help-tab').forEach(t => t.classList.remove('is-active'));
  document.querySelectorAll('.help-pane').forEach(p => { p.hidden = true; });
  document.getElementById('htab-' + tab).classList.add('is-active');
  document.getElementById('hpane-' + tab).hidden = false;
}

function showHelp(tab) {
  setHelpTab(tab || 'welcome');
  document.getElementById('welcome-backdrop').classList.remove('hidden');
  document.addEventListener('keydown', _welcomeEscHandler);
  (document.getElementById('welcome-get-started') || document.querySelector('.help-close')).focus();
}

function closeWelcome() {
  document.getElementById('welcome-backdrop').classList.add('hidden');
  document.removeEventListener('keydown', _welcomeEscHandler);
  try { localStorage.setItem(LS_WELCOME, '1'); } catch(e) {}
}

function _welcomeEscHandler(e) { if (e.key === 'Escape') closeWelcome(); }

// ─── Init: load saved layout ──────────────────────────────────────────────────

(function () {
  document.body.dataset.mode = 'edit';

  // Restore layout
  let layoutLoaded = false;
  try {
    const raw = localStorage.getItem(LS_LAYOUT);
    if (raw) {
      const d = JSON.parse(raw);
      if (d.pan && typeof d.pan.cx === 'number' && typeof d.pan.cy === 'number' && typeof d.pan.r === 'number' && Array.isArray(d.notes)) {
        state.pan    = d.pan;
        state.notes  = d.notes;
        state.nextId = 1;
        for (const n of state.notes) { const num = parseInt(n.id.replace(/\D/g,'')); if (!isNaN(num) && num >= state.nextId) state.nextId = num + 1; }
        layoutLoaded = true;
        _layoutFromStorage = true;
      }
    }
  } catch(e) {}
  if (!layoutLoaded) {
    state.pan   = JSON.parse(JSON.stringify(DEFAULT_STATE.pan));
    state.notes = JSON.parse(JSON.stringify(DEFAULT_STATE.notes));
    state.nextId = 1;
    for (const n of state.notes) { const num = parseInt(n.id.replace(/\D/g,'')); if (!isNaN(num) && num >= state.nextId) state.nextId = num + 1; }
  }

  // Restore settings
  try {
    const s = JSON.parse(localStorage.getItem(LS_SETTINGS) || 'null');
    if (s) {
      if (s.enharmonicMode) {
        enharmonicMode = s.enharmonicMode;
        const el = document.getElementById('enharmonic-mode');
        if (el) el.value = enharmonicMode;
      }
      if (s.vol != null) {
        audioPreviewVol = s.vol / 100;
        const volEl = document.getElementById('audio-vol');
        if (volEl) { volEl.value = s.vol; document.getElementById('audio-vol-val').textContent = s.vol; }
      }
      if (s.sustain != null) {
        audioPreviewSustain = s.sustain;
        const susEl = document.getElementById('audio-sustain');
        if (susEl) { susEl.value = s.sustain; document.getElementById('audio-sustain-val').textContent = s.sustain; }
      }
    }
  } catch(e) {}


  pushHistory(); resizeCanvas(); render(); syncSidebar(); syncPanSlider(); setupCustomProgDnD(); _updateEdgeBtnIcons();
  // Post-layout resize: flex layout settles after synchronous script execution,
  // so schedule a second call to ensure the SVG gets correct dimensions.
  requestAnimationFrame(() => { resizeCanvas(); render(); });

  // Show help on first visit
  try { if (!localStorage.getItem(LS_WELCOME)) showHelp(); } catch(e) {}
})();
