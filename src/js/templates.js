// ─── Templates: loaded from src/templates/ at startup ─────────────────────────
// TEMPLATES is populated asynchronously via the manifest; the dropdown is
// filled by _populateTemplateDropdown() once all fetches complete.

const TEMPLATES = [];

(async function loadTemplates() {
  try {
    const manifest = await fetch('templates/manifest.json').then(r => r.json());
    const results  = await Promise.all(
      manifest.map(f => fetch('templates/' + f).then(r => r.json()))
    );
    results.sort((a, b) => a.name.localeCompare(b.name));
    TEMPLATES.push(...results);
    _populateTemplateDropdown();
  } catch (e) {
    console.warn('Could not load templates:', e);
  }
})();

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
