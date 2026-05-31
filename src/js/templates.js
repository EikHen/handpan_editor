// ─── Templates: loaded from src/templates/ at startup ─────────────────────────
// TEMPLATES is populated asynchronously via the manifest; the dropdown is
// filled by _populateTemplateDropdown() once all fetches complete.

const TEMPLATES = [];

(async function loadTemplates() {
  try {
    const manifest = await fetch('templates/manifest.json').then(r => r.json());
    const settled = await Promise.allSettled(
      manifest.map(f => fetch('templates/' + f).then(r => {
        if (!r.ok) throw new Error(`${r.status} ${f}`);
        return r.json();
      }))
    );
    const results = settled
      .filter(r => r.status === 'fulfilled' && r.value?.name && r.value?.notes)
      .map(r => r.value);
    const failed = settled.filter(r => r.status === 'rejected');
    if (failed.length) console.warn('Templates failed to load:', failed.map(r => r.reason));
    TEMPLATES.push(...results);
    _populateTemplateDropdown();
    _applyDefaultTemplate();
  } catch (e) {
    console.warn('Could not load templates:', e);
  }
})();

const DEFAULT_TEMPLATE_NAME = 'D Kurd 18';

function _populateTemplateDropdown() {
  const sel = document.getElementById('template-select');
  if (!sel) return;
  while (sel.options.length > 1) sel.remove(1);
  TEMPLATES.forEach((tpl, i) => {
    const o = document.createElement('option');
    o.value = i; o.textContent = tpl.name;
    sel.appendChild(o);
  });
}

// Apply the default template on first visit (no saved layout in localStorage).
function _applyDefaultTemplate() {
  if (_layoutFromStorage) return;
  const tpl = TEMPLATES.find(t => t.name === DEFAULT_TEMPLATE_NAME);
  if (!tpl) return;
  state.pan    = JSON.parse(JSON.stringify(tpl.pan));
  state.notes  = JSON.parse(JSON.stringify(tpl.notes));
  state.nextId = 1;
  for (const n of state.notes) { const num = parseInt(n.id.replace(/\D/g,'')); if (!isNaN(num) && num >= state.nextId) state.nextId = num + 1; }
  state.pan.name = tpl.name;
  const panNameEl = document.getElementById('pan-name');
  if (panNameEl) panNameEl.value = tpl.name;
  selectedIds.clear();
  pushHistory(); render(); syncSidebar(); syncPanSlider();
}
